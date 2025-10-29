
import React, { useState, useEffect, useCallback } from 'react';
import type { WorkData, AboutData } from './types';
import { fetchWorkData } from './services/googleSheetService';
import { initialAboutData } from './constants';
import Header from './components/Header';
import Hero from './components/Hero';
import Works from './components/Works';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Modal from './components/Modal';
import FadeInSection from './components/FadeInSection';

const App: React.FC = () => {
    const [workData, setWorkData] = useState<WorkData | null>(null);
    const [aboutData, setAboutData] = useState<AboutData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        currentWorkId: string | null;
        visibleWorkIds: string[];
    }>({ isOpen: false, currentWorkId: null, visibleWorkIds: [] });

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedWorks = await fetchWorkData();
                setWorkData(fetchedWorks);
                setAboutData(initialAboutData);
            } catch (error) {
                console.error("Failed to load portfolio data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const openModal = useCallback((workId: string, visibleIds: string[]) => {
        setModalState({ isOpen: true, currentWorkId: workId, visibleWorkIds: visibleIds });
    }, []);

    const closeModal = useCallback(() => {
        setModalState(prevState => ({ ...prevState, isOpen: false, currentWorkId: null }));
    }, []);

    const navigateWork = useCallback((direction: number) => {
        const { currentWorkId, visibleWorkIds } = modalState;
        if (!currentWorkId || visibleWorkIds.length === 0) return;

        const currentIndex = visibleWorkIds.indexOf(currentWorkId);
        if (currentIndex === -1) return;

        const nextIndex = (currentIndex + direction + visibleWorkIds.length) % visibleWorkIds.length;
        setModalState(prevState => ({ ...prevState, currentWorkId: visibleWorkIds[nextIndex] }));
    }, [modalState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!modalState.isOpen) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') navigateWork(-1);
            if (e.key === 'ArrowRight') navigateWork(1);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [modalState.isOpen, closeModal, navigateWork]);

    useEffect(() => {
        document.body.style.overflow = modalState.isOpen ? 'hidden' : 'auto';
    }, [modalState.isOpen]);

    const currentWork = modalState.currentWorkId && workData ? workData[modalState.currentWorkId] : null;

    return (
        <div className="bg-[#F7F7F7] text-[#595959] overflow-x-hidden">
            <Header />
            {isLoading ? (
                <div className="h-screen flex items-center justify-center text-lg sm:text-xl font-semibold text-[#595959]">
                    Loading Portfolio...
                </div>
            ) : workData && aboutData ? (
                <>
                    <main>
                        <Hero />
                        <FadeInSection>
                            <Works workData={workData} onOpenModal={openModal} />
                        </FadeInSection>
                        <FadeInSection>
                            <About aboutData={aboutData} />
                        </FadeInSection>
                        <FadeInSection>
                            <Contact />
                        </FadeInSection>
                    </main>
                    <Footer />
                    {modalState.isOpen && currentWork && (
                        <Modal
                            work={currentWork}
                            onClose={closeModal}
                            onNavigate={navigateWork}
                        />
                    )}
                </>
            ) : (
                 <div className="h-screen flex items-center justify-center text-lg sm:text-xl font-semibold text-red-500">
                    Failed to load portfolio data. Please try again later.
                </div>
            )}
        </div>
    );
};

export default App;
