/**
 * TWOONG STUDIO — Google Sheets `01_Project` Event-Driven Media Sync Trigger
 *
 * 구글 시트(`work`)의 `01_Project` 탭에 새 작품 행이 추가(또는 수정 완성)될 때만
 * GitHub Actions (`repository_dispatch: sheet-row-added`)를 단 1회 호출합니다.
 * 평소에는 PC나 클라우드 어디에서도 백그라운드 작업이 실행되지 않습니다.
 */

const GITHUB_OWNER = 'BANG-TAEWOONG';
const GITHUB_REPO = 'Portfolio-Homepage';
const TARGET_SHEET_NAME = '01_Project';
const LAST_DISPATCHED_PREFIX = 'LAST_DISPATCHED_';

/**
 * 시트 열기 시 상단 전용 메뉴 생성
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎬 TWOONG 미디어 동기화')
    .addItem('지금 새 작품 동기화 실행', 'triggerManualMediaSync')
    .addSeparator()
    .addItem('GitHub 토큰 설정', 'configureGitHubToken')
    .addToUi();
}

/**
 * 설치형 `수정 시(On edit)` 트리거 전용 핸들러
 * - `01_Project` 2행 이상에서 id, title, 유효 video_url이 모두 채워지고 hidden !== TRUE일 때만 1회 호출
 */
function onProjectSheetEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== TARGET_SHEET_NAME) return;

  const startRow = e.range.getRow();
  const numRows = e.range.getNumRows();
  if (startRow + numRows - 1 < 2) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(4000)) return;

  try {
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
    if (!token) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'GitHub 토큰이 미설정 상태입니다. 상단 [🎬 TWOONG 미디어 동기화 → GitHub 토큰 설정]을 1회 진행해 주세요.',
        'TWOONG 자동 동기화',
        6
      );
      return;
    }

    const lastCol = sheet.getLastColumn();
    if (lastCol < 3) return;
    const headers = sheet
      .getRange(1, 1, 1, lastCol)
      .getValues()[0]
      .map(function (h) {
        return String(h || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      });

    const colId = headers.indexOf('id');
    const colTitle = headers.indexOf('title');
    const colHidden = headers.indexOf('hidden');
    let colVideoUrl = headers.indexOf('video_url');
    if (colVideoUrl === -1) colVideoUrl = headers.indexOf('youtube_url');

    if (colId === -1 || colTitle === -1 || colVideoUrl === -1) return;

    const props = PropertiesService.getScriptProperties();
    const firstDataRow = Math.max(2, startRow);
    const lastDataRow = startRow + numRows - 1;
    const rowValues = sheet.getRange(firstDataRow, 1, lastDataRow - firstDataRow + 1, lastCol).getValues();

    for (var i = 0; i < rowValues.length; i++) {
      var row = rowValues[i];
      var workId = String(row[colId] || '').trim();
      var title = String(row[colTitle] || '').trim();
      var hidden = colHidden !== -1 ? String(row[colHidden] || '').trim().toUpperCase() : '';
      var videoUrl = String(row[colVideoUrl] || '').trim();

      if (!workId || !title || !videoUrl || hidden === 'TRUE') continue;
      if (!isSupportedVideoUrl_(videoUrl)) continue;

      var dedupeKey = LAST_DISPATCHED_PREFIX + workId;
      var lastSent = props.getProperty(dedupeKey);
      if (lastSent === videoUrl) {
        continue;
      }

      var ok = dispatchGitHubMediaSync_(token, 'sheet-row-added', {
        work_id: workId,
        title: title,
      });

      if (ok) {
        props.setProperty(dedupeKey, videoUrl);
        SpreadsheetApp.getActiveSpreadsheet().toast(
          '새 작품 [' + title + '] 썸네일·미리보기·스틸컷 자동 추출을 시작했습니다 (~2분 후 반영).',
          'TWOONG 자동 동기화',
          6
        );
      }
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * 상단 메뉴: 즉시 전체 누락 작품 수동 동기화
 */
function triggerManualMediaSync() {
  const ui = SpreadsheetApp.getUi();
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    ui.alert('먼저 [🎬 TWOONG 미디어 동기화 → GitHub 토큰 설정]으로 GitHub 토큰을 등록해 주세요.');
    return;
  }

  const ok = dispatchGitHubMediaSync_(token, 'manual-sync', {
    work_id: '',
    source: 'sheet-menu',
  });

  if (ok) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'GitHub 클라우드에서 새 작품 미디어 동기화를 즉시 시작했습니다 (~2분 소요).',
      'TWOONG 미디어 동기화',
      6
    );
  } else {
    ui.alert('GitHub 호출에 실패했습니다. 토큰 권한(Contents: Read and write)을 확인해 주세요.');
  }
}

/**
 * 상단 메뉴: GitHub Fine-Grained Token 안전 저장
 */
function configureGitHubToken() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    'GitHub Fine-Grained Token 등록',
    'Portfolio-Homepage 저장소 Contents(Read and write) 권한 토큰을 붙여넣으세요:',
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;

  const token = String(res.getResponseText() || '').trim();
  if (!token) {
    ui.alert('빈 값은 저장되지 않았습니다.');
    return;
  }

  PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
  ui.alert('GitHub 토큰이 안전하게 저장되었습니다.\n이제 트리거에서 onProjectSheetEdit(수정 시)를 연결하면 새 행 입력 시 자동 동기화됩니다.');
}

function isSupportedVideoUrl_(url) {
  return /(?:youtube\.com|youtu\.be|instagram\.com|instagr\.am)\//i.test(url);
}

function dispatchGitHubMediaSync_(token, eventType, clientPayload) {
  var endpoint = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/dispatches';
  var payload = {
    event_type: eventType,
    client_payload: clientPayload || {},
  };

  var resp = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    payload: JSON.stringify(payload),
  });

  var code = resp.getResponseCode();
  return code === 204 || (code >= 200 && code < 300);
}
