import React, { useState, useEffect, useRef } from 'react';
import { useSiteTexts } from '../integrations/useSiteTexts';
import { smoothScrollTo } from '../integrations/smoothScroll';

interface AdminProps {
    onClose: () => void;
}

const ADMIN_PW_STORAGE_KEY = 'tw_admin_password_hash_v1';
const WORK_SHEET_PROJECT_URL =
    'https://docs.google.com/spreadsheets/d/1ui6NN8gESJu5LC5EFGaXXMShPBkgd7_vf30lvLFgAQo/edit#gid=0';
const WORK_SHEET_SITETEXT_URL =
    'https://docs.google.com/spreadsheets/d/1ui6NN8gESJu5LC5EFGaXXMShPBkgd7_vf30lvLFgAQo/edit#gid=877199329';

/** Pure synchronous SHA-256 hex digest (works identically across http://localhost, file://, and https://) */
const sha256Hex = (message: string): string => {
    const bytes = new TextEncoder().encode(message);
    const bitLen = bytes.length * 8;
    const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(paddedLen - 4, bitLen >>> 0, false);

    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const w = new Int32Array(64);
    const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

    for (let offset = 0; offset < paddedLen; offset += 64) {
        for (let i = 0; i < 16; i++) w[i] = view.getInt32(offset + i * 4, false);
        for (let i = 16; i < 64; i++) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        for (let i = 0; i < 64; i++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;
            h = g; g = f; f = e; e = (d + temp1) | 0;
            d = c; c = b; b = a; a = (temp1 + temp2) | 0;
        }
        h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7]
        .map((n) => (n >>> 0).toString(16).padStart(8, '0'))
        .join('');
};

// 구글 앱스 스크립트 코드 스니펫 (sitetext 탭 썸네일 크롭·비율 자동 저장용)
const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("sitetext") || ss.getSheetByName("SiteTexts");

    if (!sheet) {
      var sheets = ss.getSheets();
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getSheetId() == 877199329 || sheets[i].getName().toLowerCase().indexOf("text") > -1) {
          sheet = sheets[i];
          break;
        }
      }
      if (!sheet) sheet = ss.getSheets()[0];
    }

    var data = JSON.parse(e.postData.contents);
    var rows = sheet.getDataRange().getValues();
    var keyColIndex = 0;
    var valColIndex = 1;

    if (rows.length > 0) {
      for (var c = 0; c < rows[0].length; c++) {
        var header = rows[0][c].toString().toLowerCase().trim();
        if (header === 'key') keyColIndex = c;
        if (header === 'value') valColIndex = c;
      }
    }

    var updatedCount = 0;
    var edits = Array.isArray(data) ? data : [data];

    for (var i = 0; i < edits.length; i++) {
      var edit = edits[i];
      var targetKey = edit.key;
      var targetValue = edit.value;
      var found = false;
      for (var r = 1; r < rows.length; r++) {
        if (rows[r][keyColIndex].toString().trim() === targetKey) {
          sheet.getRange(r + 1, valColIndex + 1).setValue(targetValue);
          updatedCount++;
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([targetKey, targetValue]);
        updatedCount++;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: updatedCount }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

const Admin: React.FC<AdminProps> = ({ onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [password, setPassword] = useState('');
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [jsonCopySuccess, setJsonCopySuccess] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwStatusMsg, setPwStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [hasCustomHash, setHasCustomHash] = useState<boolean>(() => {
        try {
            return Boolean(localStorage.getItem(ADMIN_PW_STORAGE_KEY));
        } catch {
            return false;
        }
    });

    const { texts, updateText, isEditMode, setIsEditMode, scriptUrl, setScriptUrl } = useSiteTexts();

    const activeCustomHash = (() => {
        try {
            return localStorage.getItem(ADMIN_PW_STORAGE_KEY) || texts.adminPasswordHash || '';
        } catch {
            return texts.adminPasswordHash || '';
        }
    })();

    useEffect(() => {
        setHasCustomHash(Boolean(activeCustomHash));
    }, [activeCustomHash]);

    // Open native top-layer modal via `showModal()` and attach `closedby` fallback for browsers without native support
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (!dialog.open) {
            dialog.showModal();
        }

        if (!('closedBy' in HTMLDialogElement.prototype)) {
            const handleBackdropClick = (event: MouseEvent) => {
                if (event.target !== dialog) return;
                const rect = dialog.getBoundingClientRect();
                const isInside =
                    rect.top <= event.clientY &&
                    event.clientY <= rect.top + rect.height &&
                    rect.left <= event.clientX &&
                    event.clientX <= rect.left + rect.width;
                if (!isInside) {
                    dialog.close();
                }
            };
            dialog.addEventListener('click', handleBackdropClick);
            return () => dialog.removeEventListener('click', handleBackdropClick);
        }
    }, []);

    const handleCloseDialog = () => {
        const dialog = dialogRef.current;
        if (dialog && dialog.open) {
            dialog.close();
        } else {
            onClose();
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const defaultEnvPassword = import.meta.env.VITE_ADMIN_PASSWORD || '0000';
        const isValid = activeCustomHash
            ? sha256Hex(password) === activeCustomHash
            : password === defaultEnvPassword;

        if (isValid) {
            setIsAuthenticated(true);
            setPassword('');
            setLoginError('');
        } else {
            setLoginError('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
        }
    };

    const handleJumpToWorkFraming = () => {
        setIsEditMode(true);
        handleCloseDialog();
        window.setTimeout(() => {
            smoothScrollTo('work', 12);
        }, 80);
    };

    const handleCopyFramingJson = async () => {
        const summary = [
            `[workCropPositions]`,
            texts.workCropPositions || '{}',
            ``,
            `[workOrientationOverrides]`,
            texts.workOrientationOverrides || '{}',
        ].join('\n');
        try {
            await navigator.clipboard.writeText(summary);
            setJsonCopySuccess(true);
            window.setTimeout(() => setJsonCopySuccess(false), 2400);
        } catch (err) {
            console.error('Failed to copy framing JSON:', err);
        }
    };

    const handleSaveNewPassword = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newPassword.trim();
        if (trimmed.length < 4) {
            setPwStatusMsg({ type: 'err', text: '비밀번호는 최소 4자 이상이어야 합니다.' });
            return;
        }
        if (trimmed !== confirmPassword.trim()) {
            setPwStatusMsg({ type: 'err', text: '새 비밀번호와 확인 입력이 일치하지 않습니다.' });
            return;
        }
        const nextHash = sha256Hex(trimmed);
        try {
            localStorage.setItem(ADMIN_PW_STORAGE_KEY, nextHash);
        } catch {
            // ignore storage quota errors
        }
        updateText('adminPasswordHash', nextHash);
        setHasCustomHash(true);
        setNewPassword('');
        setConfirmPassword('');
        setPwStatusMsg({
            type: 'ok',
            text: '새 비밀번호가 적용되었습니다. (다른 기기에도 동기화하려면 하단 저장 또는 sitetext 시트에 해시를 붙여넣으세요.)',
        });
    };

    const handleResetPasswordToDefault = () => {
        try {
            localStorage.removeItem(ADMIN_PW_STORAGE_KEY);
        } catch {
            // ignore
        }
        updateText('adminPasswordHash', '');
        setHasCustomHash(false);
        setNewPassword('');
        setConfirmPassword('');
        setPwStatusMsg({
            type: 'ok',
            text: `초기 비밀번호(${import.meta.env.VITE_ADMIN_PASSWORD || '0000'})로 복원되었습니다.`,
        });
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
            setCopySuccess(true);
            window.setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            {...({ closedby: 'any' } as any)}
            aria-labelledby="admin-dialog-title"
            onClose={onClose}
            className="tw-admin-dialog m-auto bg-transparent p-0 border-0 max-w-none overflow-visible text-[#0A0A0B]"
        >
            {!isAuthenticated ? (
                /* ── 관리자 로그인 ── */
                <form
                    onSubmit={handleLogin}
                    className="bg-white p-7 sm:p-8 rounded-2xl shadow-2xl w-[calc(100vw-32px)] max-w-sm border border-black/10"
                >
                    <div className="text-center mb-6">
                        <div className="w-11 h-11 bg-[#0A0A0B] rounded-xl mx-auto mb-3.5 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 id="admin-dialog-title" className="text-lg font-bold text-slate-900">
                            TWOONG STUDIO Admin
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-1">
                            단축키 <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono-tech text-[10px]">Ctrl+Shift+A</kbd> · 썸네일 프레이밍 및 시트 관리
                        </p>
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="tw-admin-password"
                            className="block text-[11px] font-bold text-slate-600 mb-1.5"
                        >
                            관리자 비밀번호
                        </label>
                        <div className="relative">
                            <input
                                id="tw-admin-password"
                                name="password"
                                type={showLoginPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (loginError) setLoginError('');
                                }}
                                autoComplete="current-password"
                                enterKeyHint="done"
                                required
                                aria-invalid={loginError ? 'true' : undefined}
                                aria-describedby={loginError ? 'tw-admin-login-error' : undefined}
                                className="border border-slate-300 p-3 pr-16 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 text-base text-slate-900"
                                placeholder="비밀번호 입력"
                                autoFocus
                            />
                            <button
                                type="button"
                                aria-pressed={showLoginPw}
                                aria-label={showLoginPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                                onClick={() => setShowLoginPw((prev) => !prev)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                            >
                                {showLoginPw ? '숨김' : '표시'}
                            </button>
                        </div>
                        {loginError && (
                            <p
                                id="tw-admin-login-error"
                                role="status"
                                aria-live="polite"
                                className="mt-1.5 text-xs font-semibold text-rose-600"
                            >
                                {loginError}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2.5">
                        <button
                            type="button"
                            onClick={handleCloseDialog}
                            className="flex-1 px-4 py-2.5 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            닫기
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-[#0A0A0B] text-white px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            확인
                        </button>
                    </div>
                </form>
            ) : (
                /* ── Admin A안 대시보드: Google Sheet Single Master + Thumbnail Framing ── */
                <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-32px)] max-w-xl flex flex-col max-h-[85vh] border border-black/10">
                    <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div>
                            <h2 id="admin-dialog-title" className="text-lg font-bold text-slate-900">
                                Admin Studio Tools
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                구글 시트 단일 마스터 연동 · 썸네일 프레이밍 전용 모드
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCloseDialog}
                            aria-label="관리자 창 닫기"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                        {/* 1. 썸네일 프레이밍 조절 (크롭 위치 + 가로/세로 전환) */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-4 sm:p-5 space-y-3.5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                        <span className="w-1.5 h-4 bg-emerald-500 mr-2 rounded-full" />
                                        썸네일 프레이밍 조절 모드
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        활성화하면 WORKS 상단에 <b>「✥ 썸네일 위치 조절」</b> 버튼이 열려 카드 크롭 초점과 16:9 / 9:16 비율을 드래그로 맞출 수 있습니다.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isEditMode}
                                    aria-label="썸네일 프레이밍 조절 모드 켜기 또는 끄기"
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0 cursor-pointer ${
                                        isEditMode ? 'bg-slate-900' : 'bg-slate-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                            isEditMode ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleJumpToWorkFraming}
                                    className="px-3.5 py-2 bg-[#0A0A0B] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                    WORKS 섹션으로 이동해 조절하기 →
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyFramingJson}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {jsonCopySuccess ? '✓ 크롭·비율 JSON 복사됨' : '크롭·비율 설정값(JSON) 복사'}
                                </button>
                            </div>
                        </div>

                        {/* 2. 구글 시트 단일 마스터 (work 스프레드시트) */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-4 sm:p-5 space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <span className="w-1.5 h-4 bg-slate-900 mr-2 rounded-full" />
                                구글 시트 단일 마스터 (<span className="font-mono-tech mx-1">work</span>)
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                모든 작품 목록, 역할, 장비, 사이트 소개 문구는 아래 구글 스프레드시트 한 곳에서만 관리합니다. (시트 수정 시 페이지 새로고침으로 즉시 반영)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={WORK_SHEET_PROJECT_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold transition-colors"
                                >
                                    01_Project 작품 DB 열기 ↗
                                </a>
                                <a
                                    href={WORK_SHEET_SITETEXT_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold transition-colors"
                                >
                                    sitetext 문구 시트 열기 ↗
                                </a>
                            </div>
                            <ul className="text-[11px] text-slate-500 space-y-1 pt-1 list-disc list-inside leading-relaxed">
                                <li><b>title</b>에는 순수 작품명만 입력 (<code className="bg-white px-1 rounded">[MV]</code> 등 접두사는 자동 배지로 표기)</li>
                                <li><b>pinned</b> 열을 <code className="bg-white px-1 rounded">TRUE</code>로 체크한 대표작은 목록 최상단에 우선 고정됩니다</li>
                                <li>모바일·외부 접속 시 <code className="bg-white px-1 rounded">?admin=1</code> 주소로 바로 열 수 있습니다</li>
                            </ul>
                        </div>

                        {/* 3. 관리자 비밀번호 재설정 */}
                        <form
                            onSubmit={handleSaveNewPassword}
                            className="bg-slate-50 rounded-xl border border-slate-200/70 p-4 sm:p-5 space-y-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                    <span className="w-1.5 h-4 bg-slate-900 mr-2 rounded-full" />
                                    관리자 비밀번호 재설정
                                </h3>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                                    {hasCustomHash ? '사용자 지정 비밀번호 사용 중' : '초기 비밀번호(0000) 적용 중'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                비밀번호는 브라우저 내에서 SHA-256 암호화 해시로만 저장되며 원문은 남지 않습니다.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label htmlFor="tw-new-password" className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        새 비밀번호 (4자 이상)
                                    </label>
                                    <input
                                        id="tw-new-password"
                                        name="new_password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            if (pwStatusMsg) setPwStatusMsg(null);
                                        }}
                                        autoComplete="new-password"
                                        minLength={4}
                                        placeholder="4자 이상 입력"
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="tw-confirm-password" className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        새 비밀번호 확인
                                    </label>
                                    <input
                                        id="tw-confirm-password"
                                        name="confirm_password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (pwStatusMsg) setPwStatusMsg(null);
                                        }}
                                        autoComplete="new-password"
                                        minLength={4}
                                        placeholder="다시 한 번 입력"
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <button
                                    type="submit"
                                    className="px-3.5 py-2 bg-[#0A0A0B] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                    비밀번호 변경 저장
                                </button>
                                {hasCustomHash && (
                                    <button
                                        type="button"
                                        onClick={handleResetPasswordToDefault}
                                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        초기 비밀번호(0000)로 리셋
                                    </button>
                                )}
                            </div>
                            {pwStatusMsg && (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className={`text-xs font-semibold ${
                                        pwStatusMsg.type === 'ok' ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                >
                                    {pwStatusMsg.text}
                                </p>
                            )}
                        </form>

                        {/* 4. Apps Script 자동 저장 연동 (선택사항) */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-4 sm:p-5 space-y-3.5">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <span className="w-1.5 h-4 bg-indigo-500 mr-2 rounded-full" />
                                Apps Script 자동 저장 연동 (선택사항)
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                썸네일 크롭·비율 조절값을 버튼 1번으로 구글 시트 <code className="bg-white px-1 rounded">sitetext</code>에 자동 전송하려면 웹 앱 URL을 연결하세요.
                            </p>

                            <div className="space-y-1.5">
                                <label htmlFor="tw-script-url" className="text-[11px] font-bold text-slate-600 tracking-wider uppercase block">
                                    Apps Script Web App URL
                                </label>
                                <input
                                    id="tw-script-url"
                                    name="script_url"
                                    type="url"
                                    value={scriptUrl}
                                    onChange={(e) => setScriptUrl(e.target.value)}
                                    autocapitalize="none"
                                    spellCheck={false}
                                    placeholder="https://script.google.com/macros/s/.../exec"
                                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                {scriptUrl ? (
                                    <span className="text-[11px] text-emerald-600 font-semibold block">✓ 연동 완료 (저장 시 시트로 바로 전송됩니다)</span>
                                ) : (
                                    <span className="text-[11px] text-slate-500 font-medium block">미등록 상태에서도 위「크롭·비율 설정값(JSON) 복사」로 sitetext에 붙여넣어 반영할 수 있습니다.</span>
                                )}
                            </div>

                            <div className="border-t border-slate-200/70 pt-3">
                                <button
                                    type="button"
                                    aria-expanded={showGuide}
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="text-xs text-slate-600 hover:text-slate-950 font-bold flex items-center gap-1.5 focus:outline-none cursor-pointer"
                                >
                                    <span>{showGuide ? '▼' : '▶'} Google Apps Script 설정 방법 보기</span>
                                </button>

                                {showGuide && (
                                    <div className="mt-3 text-xs text-slate-500 space-y-3 pl-2 border-l border-slate-200">
                                        <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                                            <li><code className="bg-white px-1 rounded">work</code> 시트 상단 메뉴 <b>확장 프로그램 &gt; Apps Script</b> 열기</li>
                                            <li>아래 코드를 붙여넣어 저장 후 <b>배포 &gt; 새 배포</b> 선택</li>
                                            <li>유형: <b>웹 앱</b> / 실행: <b>나</b> / 액세스: <b>모든 사용자(Anyone)</b></li>
                                            <li>생성된 <b>웹 앱 URL</b>을 위 입력칸에 등록</li>
                                        </ol>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                                <span>Apps Script Code</span>
                                                <button
                                                    type="button"
                                                    onClick={handleCopyCode}
                                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors cursor-pointer"
                                                >
                                                    {copySuccess ? '복사 완료!' : '전체 코드 복사'}
                                                </button>
                                            </div>
                                            <pre className="bg-slate-900 text-slate-200 text-[10px] p-3 rounded-lg overflow-x-auto max-h-[150px] leading-relaxed">
                                                {APPS_SCRIPT_CODE}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </dialog>
    );
};

export default Admin;
