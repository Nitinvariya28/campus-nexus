import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AISidebar from '../../components/ai/AISidebar';
import RecommendationsView from '../../components/ai/recommendations/RecommendationsView';
import ResumeAnalyzerView from '../../components/ai/resume/ResumeAnalyzerView';
import ChatbotView from '../../components/ai/chat/ChatbotView';

/**
 * AIModePage Component
 * Dedicated full AI Mode page orchestrating:
 * 1. AI Profile Recommendations (Top 5 Students & Alumni with independent pagination)
 * 2. Resume ATS Analyzer & Gemini Google XYZ Enhancer
 * 3. NSU Grounded RAG Chatbot
 */
export default function AIModePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab state synced with URL query param (?tab=recommendations|resume|chat)
  const tabParam = searchParams.get('tab');
  const validTabs = ['recommendations', 'resume', 'chat'];
  const activeTab = validTabs.includes(tabParam) ? tabParam : 'recommendations';

  const handleSelectTab = (tabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tabId);
    setSearchParams(nextParams);
  };

  return (
    <div className="w-full pb-10">
      {/* Synchronized Two-Column Layout (Matching Community Page Design Language) */}
      <div className="flex flex-col md:flex-row items-start gap-5 lg:gap-6">
        {/* LEFT COLUMN: Sidebar Navigation Rail (Desktop sticky top-20) */}
        <div className="w-full md:w-64 lg:w-72 shrink-0 md:sticky md:top-20">
          <AISidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />
        </div>

        {/* RIGHT COLUMN: Active AI Feature Viewport */}
        <main className="flex-1 min-w-0 w-full">
          {activeTab === 'recommendations' && <RecommendationsView />}
          {activeTab === 'resume' && <ResumeAnalyzerView />}
          {activeTab === 'chat' && <ChatbotView />}
        </main>
      </div>
    </div>
  );
}
