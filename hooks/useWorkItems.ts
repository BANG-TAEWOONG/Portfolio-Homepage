import { useState, useEffect } from 'react';
import { WorkItem } from '../types';
import { fetchWorkItems } from '../services/googleSheetService';

/**
 * 프로젝트(Work Items) 데이터를 비동기로 가져오고 상태를 관리하는 커스텀 훅
 * @returns { items, loading, error } - 데이터 배열, 로딩 상태, 에러 객체
 */
export const useWorkItems = () => {
    // 1. 상태(State) 관리
    // items: 불러온 프로젝트 데이터 리스트를 저장할 배열
    const [items, setItems] = useState<WorkItem[]>([]);
    
    // loading: 데이터를 불러오는 중인지 표시 (UI에서 로딩 스피너/스켈레톤 처리에 사용)
    // 초기값은 true (페이지 들어가자마자 로딩 시작하므로)
    const [loading, setLoading] = useState<boolean>(true);
    
    // error: 데이터 로드 중 문제가 생겼을 때 에러 정보를 저장
    const [error, setError] = useState<Error | null>(null);

    // 2. 데이터 페칭 (Side Effect)
    // 컴포넌트가 처음 렌더링될 때(마운트 시) 딱 한 번 실행됨
    useEffect(() => {
        const loadData = async () => {
            try {
                // 로딩 시작: UI에 "로딩 중" 표시
                setLoading(true);
                
                // 서비스 함수 호출: Google Sheet(또는 API)에서 데이터 가져오기 대기
                const data = await fetchWorkItems();
                
                // 성공 시: 가져온 데이터를 상태에 저장하고 에러 초기화
                setItems(data);
                setError(null);
            } catch (err) {
                // 실패 시: 콘솔에 에러 로그 출력
                console.error('Failed to load work items:', err);
                
                // 에러 상태 업데이트 (타입 안전성 확보)
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                // 성공하든 실패하든 상관없이 로딩 상태 종료 (UI 로딩 표시 제거)
                setLoading(false);
            }
        };

        loadData(); // 비동기 함수 실행
    }, []); // 빈 배열 dependency: 컴포넌트 마운트 시 1회만 실행

    // 3. 결과 반환
    // 이 훅을 사용하는 컴포넌트는 아래 3가지를 받아 UI를 그림
    return { items, loading, error };
};
