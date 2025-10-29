
import React from 'react';

const SetupGuide: React.FC = () => {
    const codeBlockClass = "block w-full text-left bg-gray-800 text-green-300 p-4 rounded-md text-xs sm:text-sm font-mono whitespace-pre-wrap break-all my-2";
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxJ4VI4bE5o7PXX7C4g_k_x8OO7tAnRYgGF0zGE9SCa5K6H9F1N6m78pEWldMa07sI7VqSDVlUgXb7/pub?output=csv";

    return (
        <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12 bg-white" id="guide">
            <div className="max-w-screen-xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tighter text-[#2a2a2a]">Update Your Portfolio</h2>
                    <p className="mt-4 text-base sm:text-lg font-medium text-[#7a7a7a] tracking-tight max-w-2xl mx-auto">
                        This portfolio is powered by Google Sheets. Follow these steps to update the 'Work' section without touching any code.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-[#595959]">
                    <div className="p-6 border-2 border-gray-200 rounded-lg">
                        <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-4 tracking-tight">Step 1: Prepare Your Google Sheet</h3>
                        <p className="text-sm font-medium mb-4">Create a Google Sheet with the exact following headers in the first row. The order and names must match perfectly.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2">id</th>
                                        <th className="border p-2">title</th>
                                        <th className="border p-2">category</th>
                                        <th className="border p-2">thumbnail_url</th>
                                        <th className="border p-2">...and so on</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        <p className="text-xs italic mt-2">Required headers: id, title, category, role, setup, runtime, editTool, description, thumbnail_url, videoUrl, categoryFilter, productionType, client</p>
                    </div>

                    <div className="p-6 border-2 border-gray-200 rounded-lg">
                        <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-4 tracking-tight">Step 2: Publish to the Web</h3>
                        <p className="text-sm font-medium mb-4">Make your sheet public so the website can read it.</p>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                            <li>In your Google Sheet, go to <code className="bg-gray-200 text-gray-800 px-1 rounded">File</code> &rarr; <code className="bg-gray-200 text-gray-800 px-1 rounded">Share</code> &rarr; <code className="bg-gray-200 text-gray-800 px-1 rounded">Publish to web</code>.</li>
                            <li>In the 'Link' tab, select the correct sheet containing your data.</li>
                            <li>Choose 'Comma-separated values (.csv)' from the dropdown.</li>
                            <li>Click the 'Publish' button and confirm.</li>
                            <li>Copy the generated URL. It will look something like the one in Step 3.</li>
                        </ol>
                    </div>

                    <div className="p-6 border-2 border-gray-200 rounded-lg">
                        <h3 className="text-lg sm:text-xl font-bold text-[#2a2a2a] mb-4 tracking-tight">Step 3: Update the Code</h3>
                        <p className="text-sm font-medium mb-4">Finally, replace the old URL in the code with your new one.</p>
                        <p className="text-sm">Open the file: <code className="bg-gray-200 text-gray-800 px-1 rounded">services/googleSheetService.ts</code></p>
                        <p className="text-sm mt-2">Find the <code className="bg-gray-200 text-gray-800 px-1 rounded">GOOGLE_SHEET_URL</code> constant and paste your new URL.</p>
                        <code className={codeBlockClass}>{sheetUrl}</code>
                        <p className="text-sm mt-4">Once you commit and deploy this change, your website will show the updated portfolio items.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SetupGuide;
