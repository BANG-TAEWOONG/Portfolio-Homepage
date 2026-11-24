"""Official TWOONG STUDIO Google Sheets -> Static Media Sync & Deploy Engine.

Synchronizes public rows from `01_Project` Google Sheet with verified static media:
  - Stage A: Clean full H.264 MP4s for Instagram works (`public/videos/<id>.mp4`)
  - Stage B: Local CORS-free thumbnails for Instagram works (`public/thumbnails/ig_<instaId>.jpg`)
  - Stage C: Silent 6s highlight loops for all YouTube/IG works (`public/previews/<id>.mp4`)
  - Stage D: Sharp, low-blur scene stills (`public/stills/<prefix>_1..3.jpg` + `src/data/curatedStills.ts`)
  - Stage E: Atomic manifest update (`src/data/localMediaManifest.ts`)

Usage:
  python -X utf8 scripts/sync_portfolio_media.py [--ids pj_26_016,pj_26_018] [--skip-stills] [--dry-run] [--deploy]
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[1]
VIDEOS_DIR = ROOT / "public" / "videos"
PREVIEWS_DIR = ROOT / "public" / "previews"
THUMBNAILS_DIR = ROOT / "public" / "thumbnails"
STILLS_DIR = ROOT / "public" / "stills"
MANIFEST_TS = ROOT / "src" / "data" / "localMediaManifest.ts"
CURATED_STILLS_TS = ROOT / "src" / "data" / "curatedStills.ts"
LOGS_DIR = ROOT / "logs"
LOG_FILE = LOGS_DIR / "media_sync.log"
LOCK_FILE = Path(tempfile.gettempdir()) / "twoong_portfolio_media_sync.lock"
LOCK_STALE_SEC = 1800  # 30 minutes

WORK_SPREADSHEET_ID = "1ui6NN8gESJu5LC5EFGaXXMShPBkgd7_vf30lvLFgAQo"
SHEET_CSV_URL = (
    f"https://docs.google.com/spreadsheets/d/{WORK_SPREADSHEET_ID}/export?format=csv&gid=0"
)

INSTAGRAM_RE = re.compile(
    r"(?:instagram\.com|instagr\.am)/(?:[A-Za-z0-9_.]+/)?(?:p|reel|reels|tv)/([A-Za-z0-9_-]+)",
    re.I,
)
YOUTUBE_RE = re.compile(
    r"^.*(?:youtu\.be/|v/|u/\w/|embed/|shorts/|watch\?v=|&v=)([A-Za-z0-9_-]{11})",
    re.I,
)

DEPLOY_SCOPE_PATHS = [
    "public/thumbnails",
    "public/previews",
    "public/videos",
    "public/stills",
    "src/data/localMediaManifest.ts",
    "src/data/curatedStills.ts",
]

CURATED_STILLS_HEADER = """/**
 * Curated sharp, low-motion-blur scene stills extracted locally via FFmpeg.
 * Eliminates YouTube's auto-selected blurry dance mid-frames and end-credit slates.
 */
"""


def setup_logger() -> logging.Logger:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("twoong_media_sync")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    fmt = logging.Formatter("[%(asctime)s] %(levelname)s %(message)s", "%Y-%m-%d %H:%M:%S")
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    stream = sys.stdout
    try:
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    sh = logging.StreamHandler(stream)
    sh.setFormatter(fmt)
    logger.addHandler(sh)
    return logger


def find_binary(name: str, winget_patterns: list[str], extra_paths: list[str]) -> str | None:
    found = shutil.which(name)
    if found and Path(found).is_file():
        return str(Path(found))

    local_app = Path(os.environ.get("LOCALAPPDATA", r"C:\Users\BANG\AppData\Local"))
    winget_root = local_app / "Microsoft" / "WinGet" / "Packages"
    if winget_root.is_dir():
        for pat in winget_patterns:
            matches = sorted(winget_root.glob(pat), reverse=True)
            for m in matches:
                if m.is_file():
                    return str(m)

    for cand in extra_paths:
        p = Path(cand)
        if p.is_file():
            return str(p)
    return None


def discover_binaries() -> dict[str, str]:
    bins: dict[str, str | None] = {
        "ytdlp": find_binary("yt-dlp", ["yt-dlp*/yt-dlp.EXE", "yt-dlp*/yt-dlp.exe"], []),
        "ffmpeg": find_binary("ffmpeg", ["Gyan.FFmpeg*/**/bin/ffmpeg.EXE", "Gyan.FFmpeg*/**/bin/ffmpeg.exe"], []),
        "ffprobe": find_binary("ffprobe", ["Gyan.FFmpeg*/**/bin/ffprobe.EXE", "Gyan.FFmpeg*/**/bin/ffprobe.exe"], []),
        "node": find_binary("node", ["OpenJS.NodeJS*/node.exe"], [r"C:\Program Files\nodejs\node.exe"]),
        "git": find_binary("git", ["Git.Git*/cmd/git.exe"], [r"C:\Program Files\Git\cmd\git.exe", r"C:\Program Files\Git\bin\git.exe"]),
    }
    missing = [k for k in ("ytdlp", "ffmpeg", "ffprobe", "git") if not bins.get(k)]
    if missing:
        raise FileNotFoundError(f"Required binaries missing: {missing} (discovered={bins})")
    return {k: v for k, v in bins.items() if v}


class SyncLock:
    """Prevent overlapping scheduled/manual sync executions."""

    def __init__(self, lock_path: Path, stale_seconds: int = LOCK_STALE_SEC) -> None:
        self.lock_path = lock_path
        self.stale_seconds = stale_seconds
        self.acquired = False

    def __enter__(self) -> "SyncLock":
        if self.lock_path.exists():
            try:
                age = time.time() - self.lock_path.stat().st_mtime
                if age < self.stale_seconds:
                    raise RuntimeError(
                        f"Another media sync is active ({self.lock_path}, age={int(age)}s)."
                    )
            except FileNotFoundError:
                pass
        self.lock_path.write_text(f"pid={os.getpid()} ts={time.time():.0f}\n", encoding="utf-8")
        self.acquired = True
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.acquired:
            self.lock_path.unlink(missing_ok=True)


def extract_instagram_id(url: str) -> str | None:
    if not url:
        return None
    m = INSTAGRAM_RE.search(url)
    return m.group(1) if m else None


def extract_youtube_id(url: str) -> str | None:
    if not url:
        return None
    m = YOUTUBE_RE.match(url.strip())
    return m.group(1) if m else None


def is_vertical_item(item: dict[str, str]) -> bool:
    v_raw = (item.get("vertical") or "").strip().upper()
    if v_raw in ("TRUE", "YES", "1", "VERTICAL", "PORTRAIT") or "9:16" in v_raw or "세로" in v_raw:
        return True
    if v_raw in ("FALSE", "NO", "0", "HORIZONTAL", "LANDSCAPE") or "16:9" in v_raw or "가로" in v_raw:
        return False
    url = item.get("video_url", "")
    return bool(re.search(r"/shorts/", url, re.I))


def parse_running_time_sec(rt: str) -> int:
    rt = (rt or "").strip()
    if not rt:
        return 60
    parts = [p.strip() for p in rt.split(":")]
    try:
        if len(parts) == 2:
            return max(4, int(parts[0]) * 60 + int(parts[1]))
        if len(parts) == 3:
            return max(4, int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2]))
    except ValueError:
        pass
    return 60


def fetch_public_rows() -> list[dict[str, str]]:
    url = f"{SHEET_CSV_URL}&t={int(time.time() * 1000)}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=20).read().decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(raw)))

    public_items: list[dict[str, str]] = []
    for r in rows:
        norm = {
            k.strip().lower().replace(" ", "_"): (v or "").strip()
            for k, v in r.items()
            if k and k.strip()
        }
        pid = norm.get("id", "")
        title = norm.get("title", "")
        hidden = norm.get("hidden", "").upper()
        if not pid or not title or hidden == "TRUE":
            continue
        if not norm.get("video_url") and norm.get("youtube_url"):
            norm["video_url"] = norm["youtube_url"]
        if not norm.get("running_time") and norm.get("duration"):
            norm["running_time"] = norm["duration"]
        if not norm.get("vertical"):
            for alias in ("is_vertical", "orientation", "aspect_ratio"):
                if norm.get(alias):
                    norm["vertical"] = norm[alias]
                    break
        public_items.append(norm)
    return public_items


def probe_media_info(media_path: Path, ffprobe_exe: str) -> tuple[float, int, int]:
    """Return (duration_sec, width, height) for a local video file."""
    try:
        proc = subprocess.run(
            [
                ffprobe_exe,
                "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height:format=duration",
                "-of", "json",
                str(media_path),
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
        if proc.returncode != 0:
            return 0.0, 0, 0
        data = json.loads(proc.stdout)
        streams = data.get("streams") or []
        fmt = data.get("format") or {}
        w = int(streams[0].get("width") or 0) if streams else 0
        h = int(streams[0].get("height") or 0) if streams else 0
        dur = float(fmt.get("duration") or 0.0)
        return dur, w, h
    except Exception:
        return 0.0, 0, 0


def probe_remote_duration(url: str, bins: dict[str, str]) -> float:
    try:
        proc = subprocess.run(
            [
                bins["ytdlp"],
                "--ffmpeg-location", str(Path(bins["ffmpeg"]).parent),
                "--no-playlist",
                "--no-warnings",
                "--simulate",
                "--print", "%(duration)s",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        val = (proc.stdout or "").strip().splitlines()[0] if proc.stdout else ""
        if val and val != "NA":
            return float(val)
    except Exception:
        pass
    return 0.0


def probe_mean_luma(mp4_path: Path, ffmpeg_exe: str, t_sec: float = 0.5) -> float:
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_img = Path(tmp.name)
    try:
        subprocess.run(
            [
                ffmpeg_exe, "-y", "-loglevel", "error",
                "-ss", f"{t_sec:.2f}",
                "-i", str(mp4_path),
                "-frames:v", "1",
                str(tmp_img),
            ],
            check=True,
            capture_output=True,
            timeout=30,
        )
        if not tmp_img.is_file() or tmp_img.stat().st_size == 0:
            return 0.0
        with Image.open(tmp_img) as im:
            return float(ImageStat.Stat(im.convert("L")).mean[0])
    except Exception:
        return 0.0
    finally:
        tmp_img.unlink(missing_ok=True)


def parse_curated_stills() -> dict[str, list[str]]:
    if not CURATED_STILLS_TS.is_file():
        return {}
    raw = CURATED_STILLS_TS.read_text(encoding="utf-8")
    m = re.search(
        r"CURATED_PROJECT_STILLS\s*:\s*Record<string,\s*string\[\]>\s*=\s*(\{.*\})\s*;",
        raw,
        re.S,
    )
    if not m:
        raise RuntimeError(f"Could not parse CURATED_PROJECT_STILLS in {CURATED_STILLS_TS}")
    parsed = json.loads(m.group(1))
    return {str(k): list(v) for k, v in parsed.items() if isinstance(v, list)}


def write_curated_stills(merged_map: dict[str, list[str]]) -> bool:
    serialized = json.dumps(merged_map, indent=2, ensure_ascii=False)
    content = (
        CURATED_STILLS_HEADER
        + f"export const CURATED_PROJECT_STILLS: Record<string, string[]> = {serialized};\n"
    )
    existing = CURATED_STILLS_TS.read_text(encoding="utf-8") if CURATED_STILLS_TS.is_file() else ""
    if existing == content:
        return False
    CURATED_STILLS_TS.write_text(content, encoding="utf-8")
    return True


def write_local_media_manifest() -> tuple[bool, list[str], list[str]]:
    actual_previews = sorted(p.stem for p in PREVIEWS_DIR.glob("*.mp4") if p.stat().st_size > 20_000)
    actual_videos = sorted(p.stem for p in VIDEOS_DIR.glob("*.mp4") if p.stat().st_size > 50_000)
    content = "\n".join([
        "/**",
        " * Verified Static MP4 Media Manifest (`public/previews/` & `public/videos/`)",
        " * Generated after extracting and verifying local H.264 MP4 files.",
        " */",
        "",
        f"export const LOCAL_PREVIEW_WORK_IDS = new Set<string>({json.dumps(actual_previews)});",
        "",
        f"export const LOCAL_FULL_VIDEO_WORK_IDS = new Set<string>({json.dumps(actual_videos)});",
        "",
    ])
    existing = MANIFEST_TS.read_text(encoding="utf-8") if MANIFEST_TS.is_file() else ""
    if existing == content:
        return False, actual_previews, actual_videos
    MANIFEST_TS.write_text(content, encoding="utf-8")
    return True, actual_previews, actual_videos


def resolve_still_prefix(pid: str, curated_map: dict[str, list[str]]) -> str:
    """Avoid overwriting stills owned by a different key (e.g. pj_26_013 owns pj_26_012_1..3.jpg)."""
    referenced_names: set[str] = set()
    for owner_pid, urls in curated_map.items():
        if owner_pid == pid:
            continue
        for u in urls:
            referenced_names.add(Path(u).name)

    base_slots = {f"{pid}_{i}.jpg" for i in (1, 2, 3)}
    if base_slots & referenced_names:
        return f"{pid}_s"
    return pid


def ensure_instagram_full(item: dict[str, str], bins: dict[str, str]) -> tuple[str, bool, bool, str]:
    pid = item["id"]
    url = item["video_url"]
    out_mp4 = VIDEOS_DIR / f"{pid}.mp4"
    if out_mp4.is_file() and out_mp4.stat().st_size > 50_000:
        return pid, False, True, f"cached ({out_mp4.stat().st_size // 1024} KB)"

    ffmpeg_dir = str(Path(bins["ffmpeg"]).parent)
    with tempfile.TemporaryDirectory() as td:
        raw_tpl = str(Path(td) / "raw.%(ext)s")
        proc = subprocess.run(
            [
                bins["ytdlp"],
                "--ffmpeg-location", ffmpeg_dir,
                "--no-playlist",
                "--no-warnings",
                "-f", "bv*+ba/b",
                "--merge-output-format", "mp4",
                "-o", raw_tpl,
                url,
            ],
            capture_output=True,
            text=True,
            timeout=150,
        )
        candidates = list(Path(td).glob("raw.*"))
        if proc.returncode != 0 or not candidates:
            return pid, False, False, f"yt-dlp fail: {proc.stderr[-300:]}"
        raw_file = candidates[0]

        dur_probe, _, _ = probe_media_info(raw_file, bins["ffprobe"])
        dur = dur_probe if dur_probe > 0 else parse_running_time_sec(item.get("running_time", ""))
        max_dim = 1920 if dur <= 75 else 1280
        crf = "23" if dur <= 75 else "25"
        vf = f"scale='min({max_dim},iw)':'min({max_dim},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
        tmp_mp4 = Path(td) / "out.mp4"
        ff = subprocess.run(
            [
                bins["ffmpeg"], "-y", "-loglevel", "error",
                "-i", str(raw_file),
                "-c:v", "libx264", "-preset", "fast", "-crf", crf,
                "-pix_fmt", "yuv420p",
                "-vf", vf,
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                str(tmp_mp4),
            ],
            capture_output=True,
            text=True,
            timeout=150,
        )
        if ff.returncode != 0 or not tmp_mp4.is_file():
            return pid, False, False, f"ffmpeg fail: {ff.stderr[-300:]}"

        if tmp_mp4.stat().st_size > 18 * 1024 * 1024:
            tmp_small = Path(td) / "small.mp4"
            subprocess.run(
                [
                    bins["ffmpeg"], "-y", "-loglevel", "error",
                    "-i", str(raw_file),
                    "-c:v", "libx264", "-preset", "fast", "-crf", "27",
                    "-pix_fmt", "yuv420p",
                    "-vf", "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
                    "-c:a", "aac", "-b:a", "96k",
                    "-movflags", "+faststart",
                    str(tmp_small),
                ],
                check=True,
                timeout=150,
            )
            if tmp_small.is_file() and tmp_small.stat().st_size > 50_000:
                tmp_mp4 = tmp_small

        out_mp4.write_bytes(tmp_mp4.read_bytes())

    return pid, True, True, f"extracted ({out_mp4.stat().st_size // 1024} KB)"


def _save_jpeg_if_valid(img_bytes: bytes, out_path: Path, max_edge: int = 1600, quality: int = 90) -> bool:
    try:
        with Image.open(io.BytesIO(img_bytes)) as im:
            rgb = im.convert("RGB")
            rgb.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
            if rgb.width <= 200 or rgb.height <= 200:
                return False
            tmp_path = out_path.with_suffix(".tmp.jpg")
            rgb.save(tmp_path, format="JPEG", quality=quality, optimize=True)
            tmp_path.replace(out_path)
            return out_path.is_file() and out_path.stat().st_size > 5_000
    except Exception:
        return False


def ensure_instagram_thumbnail(item: dict[str, str], bins: dict[str, str]) -> tuple[str, bool, bool, str]:
    pid = item["id"]
    url = item["video_url"]
    insta_id = extract_instagram_id(url)
    if not insta_id:
        return pid, False, True, "not instagram"

    out_jpg = THUMBNAILS_DIR / f"ig_{insta_id}.jpg"
    if out_jpg.is_file() and out_jpg.stat().st_size > 5_000:
        return pid, False, True, f"cached ({out_jpg.name}, {out_jpg.stat().st_size // 1024} KB)"

    candidate_urls: list[str] = []
    try:
        proc = subprocess.run(
            [
                bins["ytdlp"],
                "--ffmpeg-location", str(Path(bins["ffmpeg"]).parent),
                "--no-playlist",
                "--no-warnings",
                "--simulate",
                "--print", "%(thumbnail)s",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        turl = (proc.stdout or "").strip().splitlines()[0] if proc.stdout else ""
        if turl and turl.startswith("http"):
            candidate_urls.append(turl)
    except Exception:
        pass
    candidate_urls.append(f"https://www.instagram.com/p/{insta_id}/media/?size=l")

    for cand in candidate_urls:
        try:
            req = urllib.request.Request(cand, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=15).read()
            if _save_jpeg_if_valid(data, out_jpg, max_edge=1600, quality=90):
                return pid, True, True, f"downloaded ({out_jpg.name}, {out_jpg.stat().st_size // 1024} KB)"
        except Exception:
            continue

    # Fallback: crisp representative frame from local IG full MP4
    local_full = VIDEOS_DIR / f"{pid}.mp4"
    if local_full.is_file() and local_full.stat().st_size > 50_000:
        dur, _, _ = probe_media_info(local_full, bins["ffprobe"])
        dur = dur if dur > 0 else float(parse_running_time_sec(item.get("running_time", "")))
        with tempfile.TemporaryDirectory() as td:
            frame_path = Path(td) / "thumb.png"
            for frac in (0.25, 0.50, 0.15):
                t = max(0.3, min(dur - 0.5, dur * frac))
                subprocess.run(
                    [
                        bins["ffmpeg"], "-y", "-loglevel", "error",
                        "-ss", f"{t:.2f}",
                        "-i", str(local_full),
                        "-frames:v", "1",
                        str(frame_path),
                    ],
                    capture_output=True,
                    timeout=30,
                )
                if frame_path.is_file() and _save_jpeg_if_valid(frame_path.read_bytes(), out_jpg, max_edge=1600, quality=90):
                    luma = probe_mean_luma(local_full, bins["ffmpeg"], t)
                    if luma >= 18.0 or frac == 0.15:
                        return pid, True, True, f"video-frame ({out_jpg.name}, {out_jpg.stat().st_size // 1024} KB)"

    return pid, False, False, f"failed to acquire ig thumbnail ig_{insta_id}.jpg"


def ensure_preview_clip(item: dict[str, str], bins: dict[str, str]) -> tuple[str, bool, bool, str]:
    pid = item["id"]
    url = item["video_url"]
    out_mp4 = PREVIEWS_DIR / f"{pid}.mp4"
    if out_mp4.is_file() and out_mp4.stat().st_size > 20_000:
        return pid, False, True, f"cached ({out_mp4.stat().st_size // 1024} KB)"

    local_full = VIDEOS_DIR / f"{pid}.mp4"
    dur = 0.0
    local_w = 0
    local_h = 0
    if local_full.is_file() and local_full.stat().st_size > 50_000:
        dur, local_w, local_h = probe_media_info(local_full, bins["ffprobe"])
    if dur <= 0:
        dur = probe_remote_duration(url, bins)
    if dur <= 0:
        dur = float(parse_running_time_sec(item.get("running_time", "")))

    is_vert = is_vertical_item(item) or (local_h > local_w > 0 and "vertical" not in item)
    if (item.get("vertical") or "").strip().upper() == "FALSE":
        is_vert = False
    scale_filter = (
        "scale='min(480,iw)':-2:force_divisible_by=2"
        if is_vert
        else "scale='min(854,iw)':-2:force_divisible_by=2"
    )

    clip_len = min(6.0, max(2.5, dur - 0.5))
    max_start = max(0.5, dur - clip_len - 0.3)
    base_start = max(2.0, min(dur * 0.28, max_start))
    if dur < 9.0:
        base_start = max(0.5, min(1.0, max_start))

    offsets = [0.0, 5.0 if dur <= 25 else 8.0]
    ffmpeg_dir = str(Path(bins["ffmpeg"]).parent)

    if local_full.is_file() and local_full.stat().st_size > 50_000:
        with tempfile.TemporaryDirectory() as td:
            tmp_mp4 = Path(td) / "prev.mp4"
            for attempt, off in enumerate(offsets):
                st = min(base_start + off, max_start)
                subprocess.run(
                    [
                        bins["ffmpeg"], "-y", "-loglevel", "error",
                        "-ss", f"{st:.2f}",
                        "-t", f"{clip_len:.2f}",
                        "-i", str(local_full),
                        "-an",
                        "-c:v", "libx264", "-preset", "fast", "-crf", "26",
                        "-pix_fmt", "yuv420p",
                        "-vf", scale_filter,
                        "-movflags", "+faststart",
                        str(tmp_mp4),
                    ],
                    capture_output=True,
                    timeout=60,
                )
                if tmp_mp4.is_file() and tmp_mp4.stat().st_size > 20_000:
                    luma = probe_mean_luma(tmp_mp4, bins["ffmpeg"], 0.5)
                    if luma >= 14.0 or attempt == len(offsets) - 1:
                        out_mp4.write_bytes(tmp_mp4.read_bytes())
                        return pid, True, True, f"sliced IG @{st:.1f}s ({out_mp4.stat().st_size // 1024} KB, luma={luma:.1f})"
        return pid, False, False, "IG preview slice failed"

    # YouTube partial segment download via yt-dlp --download-sections
    yt_offsets = [0.0, 14.0 if dur > 30 else 6.0]
    with tempfile.TemporaryDirectory() as td:
        tmp_mp4 = Path(td) / "prev.mp4"
        for attempt, off in enumerate(yt_offsets):
            st = int(min(base_start + off, max_start))
            ed = st + int(round(clip_len)) + 1
            seg_tpl = str(Path(td) / f"seg_{attempt}.%(ext)s")
            proc = subprocess.run(
                [
                    bins["ytdlp"],
                    "--ffmpeg-location", ffmpeg_dir,
                    "--no-playlist",
                    "--no-warnings",
                    "--download-sections", f"*{st}-{ed}",
                    "-f", "bestvideo[height<=720][ext=mp4]/bestvideo[height<=720]/best[height<=720]",
                    "-o", seg_tpl,
                    url,
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            candidates = list(Path(td).glob(f"seg_{attempt}.*"))
            if proc.returncode != 0 or not candidates:
                if attempt + 1 < len(yt_offsets):
                    continue
                return pid, False, False, f"yt-dlp seg fail: {proc.stderr[-250:]}"
            seg_file = candidates[0]
            subprocess.run(
                [
                    bins["ffmpeg"], "-y", "-loglevel", "error",
                    "-t", f"{clip_len:.2f}",
                    "-i", str(seg_file),
                    "-an",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "27",
                    "-pix_fmt", "yuv420p",
                    "-vf", scale_filter,
                    "-movflags", "+faststart",
                    str(tmp_mp4),
                ],
                capture_output=True,
                timeout=60,
            )
            if tmp_mp4.is_file() and tmp_mp4.stat().st_size > 20_000:
                luma = probe_mean_luma(tmp_mp4, bins["ffmpeg"], 0.5)
                if luma >= 14.0 or attempt == len(yt_offsets) - 1:
                    out_mp4.write_bytes(tmp_mp4.read_bytes())
                    return pid, True, True, f"extracted @{st}s ({out_mp4.stat().st_size // 1024} KB, luma={luma:.1f})"

    return pid, False, False, "preview extraction failed"


def _pick_sharpest_frame(frame_paths: list[Path]) -> Path | None:
    bright_best: tuple[float, Path] | None = None
    fallback_best: tuple[float, Path] | None = None
    for fp in frame_paths:
        try:
            with Image.open(fp) as im:
                gray = im.convert("L")
                luma = float(ImageStat.Stat(gray).mean[0])
                edges = gray.filter(ImageFilter.FIND_EDGES)
                sharp = float(ImageStat.Stat(edges).stddev[0])
                if luma >= 18.0:
                    if bright_best is None or sharp > bright_best[0]:
                        bright_best = (sharp, fp)
                else:
                    score = luma * 2.0 + sharp
                    if fallback_best is None or score > fallback_best[0]:
                        fallback_best = (score, fp)
        except Exception:
            continue
    if bright_best is not None:
        return bright_best[1]
    return fallback_best[1] if fallback_best is not None else None


def ensure_curated_stills(
    item: dict[str, str],
    prefix: str,
    bins: dict[str, str],
) -> tuple[str, bool, bool, list[str], str]:
    pid = item["id"]
    url = item["video_url"]
    target_paths = [STILLS_DIR / f"{prefix}_{i}.jpg" for i in (1, 2, 3)]
    target_urls = [f"/stills/{prefix}_{i}.jpg" for i in (1, 2, 3)]

    if all(p.is_file() and p.stat().st_size > 3_000 for p in target_paths):
        return pid, False, True, target_urls, f"cached on disk ({prefix}_1..3)"

    local_full = VIDEOS_DIR / f"{pid}.mp4"
    dur = 0.0
    if local_full.is_file() and local_full.stat().st_size > 50_000:
        dur, _, _ = probe_media_info(local_full, bins["ffprobe"])
    if dur <= 0:
        dur = probe_remote_duration(url, bins)
    if dur <= 0:
        dur = float(parse_running_time_sec(item.get("running_time", "")))

    fractions = (0.20, 0.50, 0.78)
    ffmpeg_dir = str(Path(bins["ffmpeg"]).parent)
    created_any = False

    with tempfile.TemporaryDirectory() as td:
        for slot_idx, frac in enumerate(fractions, start=1):
            out_path = target_paths[slot_idx - 1]
            if out_path.is_file() and out_path.stat().st_size > 3_000:
                continue

            t_target = max(1.0, min(max(1.0, dur - 2.2), dur * frac))
            slot_dir = Path(td) / f"slot_{slot_idx}"
            slot_dir.mkdir(parents=True, exist_ok=True)
            frame_tpl = str(slot_dir / "f_%02d.png")

            if local_full.is_file() and local_full.stat().st_size > 50_000:
                subprocess.run(
                    [
                        bins["ffmpeg"], "-y", "-loglevel", "error",
                        "-ss", f"{t_target:.2f}",
                        "-t", "2.0",
                        "-i", str(local_full),
                        "-vf", "fps=5/2",
                        "-frames:v", "5",
                        frame_tpl,
                    ],
                    capture_output=True,
                    timeout=45,
                )
            else:
                st_int = max(0, int(t_target))
                ed_int = max(st_int + 2, int(min(dur, st_int + 3)))
                seg_tpl = str(slot_dir / "seg.%(ext)s")
                dl = subprocess.run(
                    [
                        bins["ytdlp"],
                        "--ffmpeg-location", ffmpeg_dir,
                        "--no-playlist",
                        "--no-warnings",
                        "--download-sections", f"*{st_int}-{ed_int}",
                        "-f", "bestvideo[height<=1080][ext=mp4]/bestvideo[height<=1080]/best[height<=1080]",
                        "-o", seg_tpl,
                        url,
                    ],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                seg_cands = list(slot_dir.glob("seg.*"))
                if dl.returncode == 0 and seg_cands:
                    subprocess.run(
                        [
                            bins["ffmpeg"], "-y", "-loglevel", "error",
                            "-i", str(seg_cands[0]),
                            "-vf", "fps=5/2",
                            "-frames:v", "5",
                            frame_tpl,
                        ],
                        capture_output=True,
                        timeout=45,
                    )

            frames = sorted(slot_dir.glob("f_*.png"))
            winner = _pick_sharpest_frame(frames)
            if not winner:
                return pid, created_any, False, [], f"failed slot {slot_idx} at {t_target:.1f}s"

            with Image.open(winner) as im:
                rgb = im.convert("RGB")
                rgb.thumbnail((1400, 900), Image.Resampling.LANCZOS)
                tmp_jpg = out_path.with_suffix(".tmp.jpg")
                rgb.save(tmp_jpg, format="JPEG", quality=88, optimize=True)
                tmp_jpg.replace(out_path)
            created_any = True

    if all(p.is_file() and p.stat().st_size > 3_000 for p in target_paths):
        return pid, created_any, True, target_urls, f"saved {prefix}_1..3"
    return pid, created_any, False, [], "incomplete stills"


def filter_supported_items(items: list[dict[str, str]], ids_filter: set[str] | None) -> list[dict[str, str]]:
    out = []
    for it in items:
        pid = it["id"]
        if ids_filter and pid not in ids_filter:
            continue
        vurl = it.get("video_url", "")
        if extract_instagram_id(vurl) or extract_youtube_id(vurl):
            out.append(it)
    return out


def compute_missing_audit(items: list[dict[str, str]], curated_map: dict[str, list[str]]) -> list[dict[str, object]]:
    report = []
    for it in items:
        pid = it["id"]
        vurl = it.get("video_url", "")
        ig_id = extract_instagram_id(vurl)
        yt_id = extract_youtube_id(vurl)
        missing: list[str] = []
        if ig_id:
            if not (VIDEOS_DIR / f"{pid}.mp4").is_file() or (VIDEOS_DIR / f"{pid}.mp4").stat().st_size <= 50_000:
                missing.append(f"videos/{pid}.mp4")
            if not (THUMBNAILS_DIR / f"ig_{ig_id}.jpg").is_file() or (THUMBNAILS_DIR / f"ig_{ig_id}.jpg").stat().st_size <= 5_000:
                missing.append(f"thumbnails/ig_{ig_id}.jpg")
        if ig_id or yt_id:
            if not (PREVIEWS_DIR / f"{pid}.mp4").is_file() or (PREVIEWS_DIR / f"{pid}.mp4").stat().st_size <= 20_000:
                missing.append(f"previews/{pid}.mp4")
            if pid not in curated_map:
                missing.append(f"curatedStills[{pid}]")
        if missing:
            report.append({"id": pid, "title": it.get("title", ""), "missing": missing})
    return report


def run_deploy(bins: dict[str, str], summary_ids: list[str], logger: logging.Logger) -> int:
    git_exe = bins["git"]
    node_exe = bins.get("node")
    if not node_exe:
        logger.error("Node.js binary not found; cannot run vite build before deploy.")
        return 1

    st = subprocess.run(
        [git_exe, "status", "--porcelain", "--", *DEPLOY_SCOPE_PATHS],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    if st.returncode != 0:
        logger.error("git status failed: %s", st.stderr.strip())
        return 1
    if not st.stdout.strip():
        logger.info("No new or modified media assets in git scope; skipping build & deploy.")
        return 0

    logger.info("Running Vite production build prior to deploy...")
    vb = subprocess.run(
        [node_exe, "node_modules/vite/bin/vite.js", "build"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    if vb.returncode != 0:
        logger.error("Vite build failed:\n%s\n%s", vb.stdout[-500:], vb.stderr[-500:])
        return 1

    add = subprocess.run(
        [git_exe, "add", "--", *DEPLOY_SCOPE_PATHS],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    if add.returncode != 0:
        logger.error("git add failed: %s", add.stderr.strip())
        return 1

    diff = subprocess.run(
        [git_exe, "diff", "--cached", "--name-only"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    staged_files = [ln.strip() for ln in diff.stdout.splitlines() if ln.strip()]
    if not staged_files:
        logger.info("Nothing staged after git add; skipping commit.")
        return 0

    for sf in staged_files:
        if not any(sf == p or sf.startswith(p + "/") for p in DEPLOY_SCOPE_PATHS):
            logger.error("SAFETY ABORT: Unexpected staged path outside media scope: %s", sf)
            return 1

    tag = ", ".join(summary_ids[:5]) + ("..." if len(summary_ids) > 5 else "")
    msg = f"chore(media): sync portfolio assets ({tag or f'{len(staged_files)} files'})"
    cm = subprocess.run(
        [git_exe, "commit", "-m", msg],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    if cm.returncode != 0:
        logger.error("git commit failed: %s %s", cm.stdout, cm.stderr)
        return 1

    ps = subprocess.run(
        [git_exe, "push", "origin", "main"],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    if ps.returncode != 0:
        logger.error("git push failed: %s %s", ps.stdout, ps.stderr)
        return 1

    logger.info("Deployed %d files via commit & push origin/main.", len(staged_files))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="TWOONG STUDIO static portfolio media sync")
    parser.add_argument("--ids", help="Comma-separated work IDs (e.g. pj_26_016,pj_26_018)", default="")
    parser.add_argument("--skip-stills", action="store_true", help="Skip Stage D scene stills extraction")
    parser.add_argument("--dry-run", action="store_true", help="Report missing assets without modifying disk")
    parser.add_argument("--deploy", action="store_true", help="Build, commit & push media assets if changed")
    args = parser.parse_args()

    logger = setup_logger()
    try:
        bins = discover_binaries()
    except Exception as exc:
        logger.error("Binary discovery failed: %s", exc)
        return 1

    try:
        public_rows = fetch_public_rows()
    except Exception as exc:
        logger.error("Failed to fetch Google Sheet CSV: %s", exc)
        return 1

    ids_filter = {s.strip() for s in args.ids.split(",") if s.strip()} if args.ids else None
    playable_items = filter_supported_items(public_rows, ids_filter)
    curated_map = parse_curated_stills()

    if args.dry_run:
        missing = compute_missing_audit(playable_items, curated_map)
        logger.info("DRY-RUN: %d playable public items inspected, %d missing assets.", len(playable_items), len(missing))
        for entry in missing:
            logger.info("  MISSING %s (%s): %s", entry["id"], entry["title"], ", ".join(entry["missing"]))
        return 0

    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    STILLS_DIR.mkdir(parents=True, exist_ok=True)

    changed_ids: list[str] = []
    failures: list[str] = []

    try:
        with SyncLock(LOCK_FILE):
            ig_items = [it for it in playable_items if extract_instagram_id(it.get("video_url", ""))]
            logger.info("Sync started: %d playable public items (%d Instagram).", len(playable_items), len(ig_items))

            # Fast no-op check? Still run idempotent checks in memory/disk (<1s when all cached)
            # Stage A: Instagram full MP4
            with ThreadPoolExecutor(max_workers=2) as pool:
                futs = {pool.submit(ensure_instagram_full, it, bins): it for it in ig_items}
                for fut in as_completed(futs):
                    pid, changed, ok, msg = fut.result()
                    if changed or not ok:
                        logger.info("[Stage A IG Full] %s: %s - %s", pid, "OK" if ok else "FAIL", msg)
                    if changed:
                        changed_ids.append(pid)
                    if not ok:
                        failures.append(f"StageA:{pid}:{msg}")

            # Stage B: Instagram thumbnails
            with ThreadPoolExecutor(max_workers=2) as pool:
                futs = {pool.submit(ensure_instagram_thumbnail, it, bins): it for it in ig_items}
                for fut in as_completed(futs):
                    pid, changed, ok, msg = fut.result()
                    if changed or not ok:
                        logger.info("[Stage B IG Thumb] %s: %s - %s", pid, "OK" if ok else "FAIL", msg)
                    if changed:
                        changed_ids.append(pid)
                    if not ok:
                        failures.append(f"StageB:{pid}:{msg}")

            # Stage C: Muted 6s preview clips (YouTube + Instagram)
            with ThreadPoolExecutor(max_workers=4) as pool:
                futs = {pool.submit(ensure_preview_clip, it, bins): it for it in playable_items}
                for fut in as_completed(futs):
                    pid, changed, ok, msg = fut.result()
                    if changed or not ok:
                        logger.info("[Stage C Preview] %s: %s - %s", pid, "OK" if ok else "FAIL", msg)
                    if changed:
                        changed_ids.append(pid)
                    if not ok:
                        failures.append(f"StageC:{pid}:{msg}")

            # Stage D: Sharp scene stills (only for items missing from curatedStills)
            if not args.skip_stills:
                missing_still_items = [it for it in playable_items if it["id"] not in curated_map]
                new_stills_entries: dict[str, list[str]] = {}
                if missing_still_items:
                    prefixes = {
                        it["id"]: resolve_still_prefix(it["id"], curated_map)
                        for it in missing_still_items
                    }
                    with ThreadPoolExecutor(max_workers=2) as pool:
                        futs = {
                            pool.submit(ensure_curated_stills, it, prefixes[it["id"]], bins): it
                            for it in missing_still_items
                        }
                        for fut in as_completed(futs):
                            pid, changed, ok, urls, msg = fut.result()
                            if changed or not ok:
                                logger.info("[Stage D Stills] %s: %s - %s", pid, "OK" if ok else "FAIL", msg)
                            if changed:
                                changed_ids.append(pid)
                            if ok and urls:
                                new_stills_entries[pid] = urls
                            else:
                                failures.append(f"StageD:{pid}:{msg}")

                    if new_stills_entries:
                        # Preserve order of public_rows for newly added items at top, keeping every existing entry untouched below
                        ordered_new: dict[str, list[str]] = {}
                        for it in playable_items:
                            pid = it["id"]
                            if pid in new_stills_entries:
                                ordered_new[pid] = new_stills_entries[pid]
                        merged = {**ordered_new, **curated_map}
                        if write_curated_stills(merged):
                            logger.info("Updated src/data/curatedStills.ts (+%d projects).", len(ordered_new))

            # Stage E: Regenerate localMediaManifest.ts strictly from verified files on disk
            manifest_changed, prev_list, vid_list = write_local_media_manifest()
            if manifest_changed:
                logger.info(
                    "Updated src/data/localMediaManifest.ts (previews=%d, ig_videos=%d).",
                    len(prev_list),
                    len(vid_list),
                )

            dedup_changed = sorted(set(changed_ids))
            logger.info(
                "Sync finished: previews=%d, ig_videos=%d, changed=%s, failures=%d",
                len(prev_list),
                len(vid_list),
                dedup_changed or "none",
                len(failures),
            )

            if args.deploy and not failures:
                rc = run_deploy(bins, dedup_changed, logger)
                if rc != 0:
                    return rc
            elif args.deploy and failures:
                logger.warning("Skipping --deploy because %d extraction failure(s) occurred.", len(failures))

    except RuntimeError as lock_err:
        logger.warning("%s", lock_err)
        return 0
    except Exception as exc:
        logger.exception("Unexpected error during sync: %s", exc)
        return 1

    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
