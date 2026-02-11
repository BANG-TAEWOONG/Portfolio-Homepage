import React, { useState, useEffect } from 'react';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { SiteTexts } from '../constants/siteTexts';

interface AdminProps {
    onClose: () => void;
}

// 필드 설정 타입
interface FieldConfig {
    key: keyof SiteTexts;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'email';
    placeholder?: string;
}

// 섹션별 필드 구성
const SECTIONS: { title: string; fields: FieldConfig[] }[] = [
    {
        title: 'Home',
        fields: [
            { key: 'homeDescription', label: '메인 카피', type: 'textarea', placeholder: '홈 화면 중앙 텍스트 (줄바꿈: \\n)' },
            { key: 'homeButtonText', label: 'CTA 버튼 텍스트', type: 'text', placeholder: 'Explore Portfolio' },
        ]
    },
    {
        title: 'About — 소개',
        fields: [
            { key: 'aboutTitle', label: '타이틀', type: 'text', placeholder: 'I AM A STORYTELLER.' },
            { key: 'aboutQuote', label: '인용구', type: 'textarea', placeholder: '인용구 텍스트' },
            { key: 'aboutDescription', label: '설명 본문', type: 'textarea', placeholder: '설명 텍스트 (줄바꿈: \\n)' },
        ]
    },
    {
        title: 'About — 핵심 가치',
        fields: [
            { key: 'aboutValue1Title', label: '가치 1 제목', type: 'text' },
            { key: 'aboutValue1Desc', label: '가치 1 설명', type: 'text' },
            { key: 'aboutValue2Title', label: '가치 2 제목', type: 'text' },
            { key: 'aboutValue2Desc', label: '가치 2 설명', type: 'text' },
            { key: 'aboutValue3Title', label: '가치 3 제목', type: 'text' },
            { key: 'aboutValue3Desc', label: '가치 3 설명', type: 'text' },
            { key: 'aboutValue4Title', label: '가치 4 제목', type: 'text' },
            { key: 'aboutValue4Desc', label: '가치 4 설명', type: 'text' },
        ]
    },
    {
        title: 'Contact',
        fields: [
            { key: 'contactSubText', label: '서브 텍스트', type: 'text', placeholder: '함께 새로운 프로젝트를 시작해볼까요?' },
            { key: 'contactEmail', label: '이메일', type: 'email', placeholder: 'email@example.com' },
            { key: 'contactInstagram', label: '인스타그램 URL', type: 'url', placeholder: 'https://instagram.com/...' },
            { key: 'contactYoutube', label: '유튜브 URL', type: 'url', placeholder: 'https://youtube.com/...' },
            { key: 'contactLocation', label: '활동 지역', type: 'text', placeholder: 'Seoul, South Korea' },
            { key: 'contactAvailability', label: '가용성 메시지', type: 'text', placeholder: 'Available for worldwide projects' },
            { key: 'contactFormUrl', label: 'Google Form URL', type: 'url', placeholder: 'https://forms.google.com/...' },
            { key: 'contactCalendarUrl', label: '캘린더 임베드 URL', type: 'url', placeholder: 'Google Calendar 임베드 URL (src="..." 안의 주소)' },
        ]
    },
    {
        title: 'Footer',
        fields: [
            { key: 'footerCopyright', label: '저작권 표시 이름', type: 'text', placeholder: 'Video Producer' },
        ]
    }
];

const Admin: React.FC<AdminProps> = ({ onClose }) => {
    const { texts, saveTexts } = useSiteTexts();
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [formData, setFormData] = useState<SiteTexts>({ ...texts });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (texts) setFormData({ ...texts });
    }, [texts]);

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

    const updateField = (key: keyof SiteTexts, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        saveTexts(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 (고정) */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                            <p className="text-xs text-slate-400 mt-0.5">사이트 텍스트 관리 · {SECTIONS.reduce((a, s) => a + s.fields.length, 0)}개 필드</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">✕</button>
                    </div>

                    {/* 스크롤 영역 */}
                    <div className="overflow-y-auto flex-1 p-5 space-y-6">
                        {SECTIONS.map((section) => (
                            <section key={section.title}>
                                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                                    <span className="w-1.5 h-5 bg-black mr-2 rounded-full"></span>
                                    {section.title}
                                </h2>
                                <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                                    {section.fields.map((field) => (
                                        <div key={field.key} className="p-4">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                {field.label}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={formData[field.key]}
                                                    onChange={(e) => updateField(field.key, e.target.value)}
                                                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y min-h-[60px]"
                                                    placeholder={field.placeholder}
                                                    rows={2}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={formData[field.key]}
                                                    onChange={(e) => updateField(field.key, e.target.value)}
                                                    className="w-full border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder={field.placeholder}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* 저장 버튼 (고정) */}
                    <div className="p-5 border-t border-slate-100 flex justify-end shrink-0">
                        <button
                            onClick={handleSave}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {saved ? '✓ 저장 완료' : '변경사항 저장'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
