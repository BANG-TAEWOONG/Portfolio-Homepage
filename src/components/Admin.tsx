import React, { useState, useEffect } from 'react';

interface AdminProps {
    onClose: () => void;
}

// 사이트 텍스트 Google Sheets 편집 URL
const SITE_TEXTS_EDIT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQS8u7I2fzhfrogdXqEptSCalEY1revbT9OpnlTleQMpISMwezEEInp8EBoE2lEFMZuKkEmWAtc8zXh/pubhtml';

const Admin: React.FC<AdminProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
                    className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm mx-4"
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
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors">취소</button>
                        <button type="submit" className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors">인증</button>
                    </div>
                </form>
            ) : (
                /* ── Admin 대시보드 ── */
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                            <p className="text-xs text-slate-400 mt-0.5">Google Sheets CMS 관리</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">✕</button>
                    </div>

                    {/* 콘텐츠 */}
                    <div className="p-5 space-y-4">
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                            <h2 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                                <span className="w-1.5 h-5 bg-black mr-2 rounded-full"></span>
                                사이트 텍스트 관리
                            </h2>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                Google Sheets에서 사이트 텍스트를 직접 편집할 수 있습니다.<br />
                                수정 후 페이지를 새로고침하면 반영됩니다.
                            </p>
                            <a
                                href={SITE_TEXTS_EDIT_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Google Sheets에서 편집
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
