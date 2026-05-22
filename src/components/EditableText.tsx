import React, { useState, useEffect, useRef } from 'react';
import { useSiteTexts } from '../hooks/useSiteTexts';
import { SiteTexts } from '../siteTexts';

interface EditableTextProps {
    textKey: keyof SiteTexts;
    className?: string;
    as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
    multiline?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({
    textKey,
    className = '',
    as: Component = 'span',
    multiline = false,
}) => {
    const { texts, isEditMode, updateText } = useSiteTexts();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(texts[textKey] || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Context의 texts가 외부에서 변경(예: discard 또는 시트 로드)되었을 때 로컬 값 동기화
    useEffect(() => {
        setValue(texts[textKey] || '');
    }, [texts, textKey]);

    // 편집 모드로 전환될 때 자동 포커스 및 선택
    useEffect(() => {
        if (isEditing) {
            if (isMultiline) {
                textareaRef.current?.focus();
                textareaRef.current?.select();
            } else {
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        }
    }, [isEditing]);

    const isMultiline = multiline || (texts[textKey] || '').includes('\n') || Component === 'p' || Component === 'div';

    const handleSave = () => {
        setIsEditing(false);
        updateText(textKey, value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setValue(texts[textKey] || ''); // 원본 복구
            setIsEditing(false);
        }
        // 싱글라인 입력기에서 Enter 클릭 시 자동 저장
        if (e.key === 'Enter' && !isMultiline) {
            handleSave();
        }
    };

    // 일반 방문자 모드일 때는 일반 태그로 단순 렌더링
    if (!isEditMode) {
        return (
            <Component className={className}>
                {texts[textKey]?.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <br />}
                        {line}
                    </React.Fragment>
                )) || ''}
            </Component>
        );
    }

    // 관리자 편집 활성화 시
    if (isEditing) {
        return (
            <span className={`inline-block w-full relative z-50`}>
                {isMultiline ? (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        rows={Math.max(2, value.split('\n').length)}
                        className={`w-full bg-slate-50 border border-slate-400 p-2 rounded focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 ${className}`}
                        style={{ font: 'inherit', color: '#0f172a', resize: 'vertical' }}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-slate-50 border border-slate-400 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 ${className}`}
                        style={{ font: 'inherit', color: '#0f172a' }}
                    />
                )}
                <span className="absolute -top-6 right-0 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow tracking-widest font-bold uppercase select-none">
                    Editing: {textKey}
                </span>
            </span>
        );
    }

    return (
        <Component
            onClick={() => setIsEditing(true)}
            className={`group/editable cursor-pointer border border-dashed border-slate-300 hover:border-slate-900 hover:bg-slate-50/50 p-0.5 rounded transition-all duration-300 relative inline-block ${className}`}
            title="클릭하여 바로 수정"
        >
            {value.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                </React.Fragment>
            ))}
            
            {/* 우측 상단 펜슬 팁 아이콘 */}
            <span className="absolute top-1 right-1 opacity-0 group-hover/editable:opacity-100 transition-opacity bg-slate-900 text-white p-0.5 rounded text-[8px] flex items-center justify-center pointer-events-none">
                ✏️
            </span>
        </Component>
    );
};

export default EditableText;
