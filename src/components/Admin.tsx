import React, { useState, useEffect } from 'react';
import { useSiteTexts } from '../hooks/useSiteTexts';

interface AdminProps {
    onClose: () => void;
}

// 구글 앱스 스크립트 코드 스니펫 (클립보드 복사용)
const APPS_SCRIPT_CODE = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("siteTexts");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets().find(function(s) {
      return s.getName().toLowerCase().indexOf("text") > -1;
    }) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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
    
    for (var r = 1; r < rows.length; r++) {
      if (rows[r][keyColIndex].toString().trim() === targetKey) {
        sheet.getCell(r + 1, valColIndex + 1).setValue(targetValue);
        updatedCount++;
        break;
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: updatedCount }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const Admin: React.FC<AdminProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const { isEditMode, setIsEditMode, scriptUrl, setScriptUrl } = useSiteTexts();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {!isAuthenticated ? (
                /* ── 비밀번호 입력 ── */
                <form
                    onSubmit={handleLogin}
                    className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Developer Mode</h2>
                        <p className="text-xs text-slate-400 mt-1">관리자 인증이 필요합니다</p>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-slate-200 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50 text-sm"
                        placeholder="비밀번호 입력"
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">취소</button>
                        <button type="submit" className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors cursor-pointer">인증</button>
                    </div>
                </form>
            ) : (
                /* ── Admin 대시보드 (넓이 조정: max-w-xl) ── */
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                            <p className="text-xs text-slate-400 mt-0.5">실시간 CMS 및 페이지 텍스트 편집기</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
                    </div>

                    {/* 콘텐츠 (스크롤 가능) */}
                    <div className="p-6 space-y-6 overflow-y-auto">
                        
                        {/* 1. 인라인 편집 활성화 스위치 */}
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 flex items-center justify-between">
                            <div className="space-y-1 pr-4">
                                <h2 className="text-sm font-bold text-slate-700 flex items-center">
                                    <span className="w-1.5 h-4 bg-emerald-500 mr-2 rounded-full"></span>
                                    화면 인라인 편집 모드
                                </h2>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    활성화 시, 페이지 내 텍스트를 마우스로 클릭하여 직접 수정할 수 있습니다.
                                </p>
                            </div>
                            
                            {/* 토글 스위치 UI */}
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer ${
                                    isEditMode ? 'bg-slate-900' : 'bg-slate-200'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                        isEditMode ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* 2. 구글 앱스 스크립트 설정 */}
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-4">
                            <h2 className="text-sm font-bold text-slate-700 flex items-center">
                                <span className="w-1.5 h-4 bg-indigo-500 mr-2 rounded-full"></span>
                                구글 시트 저장 연동 API
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                수정된 내용을 구글 시트에 업데이트하려면 배포한 <b>Google Apps Script 웹 앱 URL</b>이 필요합니다.
                            </p>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Apps Script Web App URL</label>
                                <input
                                    type="text"
                                    value={scriptUrl}
                                    onChange={(e) => setScriptUrl(e.target.value)}
                                    placeholder="https://script.google.com/macros/s/.../exec"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                                {scriptUrl ? (
                                    <span className="text-[10px] text-emerald-600 font-semibold block">✓ 연동 완료 (수정 시 실시간 자동 저장됩니다)</span>
                                ) : (
                                    <span className="text-[10px] text-rose-500 font-semibold block">⚠ 주소가 입력되지 않았습니다. 현재는 수정 시 로컬 페이지 임시 반영만 지원됩니다.</span>
                                )}
                            </div>

                            {/* 가이드 아코디언 */}
                            <div className="border-t border-slate-200/60 pt-3">
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="text-xs text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1.5 focus:outline-none cursor-pointer"
                                >
                                    <span>{showGuide ? '▼' : '▶'} Google Apps Script 설정 방법 보기</span>
                                </button>

                                {showGuide && (
                                    <div className="mt-3 text-xs text-slate-500 space-y-3 pl-2 border-l border-slate-200/80 animate-in fade-in duration-300">
                                        <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                                            <li>관리 중인 구글 스프레드시트에서 <b>확장 프로그램 &gt; Apps Script</b>를 엽니다.</li>
                                            <li>아래의 코드를 복사하여 스크립트 편집기에 붙여넣고 저장합니다.</li>
                                            <li>우측 상단 <b>배포 &gt; 새 배포</b>를 누릅니다.</li>
                                            <li>유형을 <b>웹 앱</b>으로 선택하고 아래 설정값을 적용합니다:
                                                <ul className="list-disc list-inside pl-4 mt-1 text-[11px] text-slate-400">
                                                    <li>웹 앱 실행 사용자: <b>나(Your Email)</b></li>
                                                    <li>액세스 권한 사용자: <b>모든 사용자(Anyone)</b></li>
                                                </ul>
                                            </li>
                                            <li>배포 후 생성된 <b>웹 앱 URL</b>을 위의 입력란에 등록하십시오.</li>
                                        </ol>

                                        {/* 코드 복사 영역 */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                                <span>Apps Script Code</span>
                                                <button
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
        </div>
    );
};

export default Admin;
