import React, { useState, useEffect, useCallback } from 'react';
import { fetchWorkData } from './services/googleSheetService.js';
import { initialAboutData } from './constants.js';
import Header from './components/Header.js';
import Hero from './components/Hero.js';
import Works from './components/Works.js';
import About from './components/About.js';
import Contact from './components/Contact.js';
import Footer from './components/Footer.js';
import Modal from './components/Modal.js';
import FadeInSection from './components/FadeInSection.js';
import type { WorkData } from './types.js';

const App = () => {
    // Fix: Add type for workData state.
    const [workData, setWorkData] = useState<WorkData | null>(null);
    const [aboutData, setAboutData] = useState<typeof initialAboutData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({
        isOpen: false,
        currentWorkId: null as string | null,
        visibleWorkIds: [] as string[],
    });

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

    // Fix: Add types for callback parameters.
    const openModal = useCallback((workId: string, visibleIds: string[]) => {
        setModalState({ isOpen: true, currentWorkId: workId, visibleWorkIds: visibleIds });
    }, []);

    const closeModal = useCallback(() => {
        setModalState(prevState => ({ ...prevState, isOpen: false, currentWorkId: null }));
    }, []);

    // Fix: Add type for callback parameter.
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

    return React.createElement('div', { className: "bg-[#F7F7F7] text-[#595959] overflow-x-hidden" },
        React.createElement(Header, null),
        isLoading ? (
            React.createElement('div', { className: "h-screen flex items-center justify-center text-lg sm:text-xl font-semibold text-[#595959]" }, "Loading Portfolio...")
        ) : workData && aboutData ? (
            React.createElement(React.Fragment, null,
                React.createElement('main', null,
                    React.createElement(Hero, null),
                    React.createElement(FadeInSection, null,
                        React.createElement(Works, { workData: workData, onOpenModal: openModal })
                    ),
                    React.createElement(FadeInSection, null,
                        React.createElement(About, { aboutData: aboutData })
                    ),
                    React.createElement(FadeInSection, null,
                        React.createElement(Contact, null)
                    )
                ),
                React.createElement(Footer, null),
                modalState.isOpen && currentWork && (
                    React.createElement(Modal, {
                        work: currentWork,
                        onClose: closeModal,
                        onNavigate: navigateWork
                    })
                )
            )
        ) : (
             React.createElement('div', { className: "h-screen flex items-center justify-center text-lg sm:text-xl font-semibold text-red-500" },
                "Failed to load portfolio data. Please try again later."
            )
        )
    );
};

export default App;
