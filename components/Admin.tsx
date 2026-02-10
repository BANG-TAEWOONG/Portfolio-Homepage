import React, { useState, useEffect } from 'react';
import { useSiteTexts } from '../hooks/useSiteTexts';

const Admin: React.FC = () => {
    const { texts, saveTexts } = useSiteTexts();
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [formUrl, setFormUrl] = useState('');

    useEffect(() => {
        if (texts) {
            setFormUrl(texts.contactFormUrl);
        }
    }, [texts]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
        if (password === correctPassword) {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password');
        }
    };

    const handleSave = () => {
        saveTexts({ ...texts, contactFormUrl: formUrl });
        alert('Settings saved successfully!');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                    <h2 className="text-2xl mb-6 font-bold text-slate-800 text-center">Admin Access</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border border-slate-300 p-3 w-full mb-6 rounded focus:outline-none focus:ring-2 focus:ring-slate-500"
                        placeholder="Enter Password"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="bg-slate-900 text-white px-4 py-3 w-full rounded font-bold hover:bg-slate-700 transition-colors"
                    >
                        LOGIN
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <button
                        onClick={() => window.location.hash = ''}
                        className="text-sm text-slate-500 hover:text-slate-900 underline"
                    >
                        Back to Site
                    </button>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
                            <span className="w-2 h-8 bg-black mr-3 rounded-full"></span>
                            Contact Settings
                        </h2>
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Google Form URL</label>
                            <input
                                type="text"
                                value={formUrl}
                                onChange={(e) => setFormUrl(e.target.value)}
                                className="w-full border border-slate-300 p-3 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                placeholder="https://forms.google.com/..."
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                * This link will be used for the "PROJECT INQUIRY" button in the Contact section.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        SAVE CHANGES
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Admin;
