import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import aiService from '../../../services/ai/aiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import toast from 'react-hot-toast';

/**
 * ChatbotView Component
 * Modern ChatGPT-style conversational interface grounded in Nirma University official documents & guides.
 * Features:
 * - Clean fixed bottom input composer
 * - Word-by-word streaming typewriter response
 * - Realistic search thinking status
 * - Sleek, decluttered citations & suggested follow-ups
 */
export default function ChatbotView() {
  const [messages, setMessages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (userPrompt, overrideCategory) => {
    const trimmedPrompt = (userPrompt || '').trim();
    if (!trimmedPrompt) return;

    const categoryToSend = overrideCategory || activeCategory;

    // Append user message immediately
    const userMessageObj = { role: 'user', content: trimmedPrompt };
    const nextMessages = [...messages, userMessageObj];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // Prepare conversation history (last 6 turns)
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role || 'user',
        content: (m.content || m.answer || '').slice(0, 1000),
      }));

      const response = await aiService.sendChatMessage({
        message: trimmedPrompt,
        question: trimmedPrompt,
        category: categoryToSend,
        conversation_history: historyPayload,
      });

      const botAnswer = response?.answer || response?.reply || '';
      if (response?.status === 'SUCCESS' || botAnswer) {
        const assistantMessageObj = {
          role: 'assistant',
          content: botAnswer,
          citations: response.citations || [],
          suggested_followups: response.suggested_followups || [],
          guardrail_status: response.guardrail_status || 'PASSED',
          isNew: true, // triggers smooth typewriter word streaming
        };
        setMessages([...nextMessages, assistantMessageObj]);
      } else {
        throw new Error(response?.message || 'Received empty response from assistant.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = extractErrorMessage(err, 'Failed to fetch AI assistant reply. Please try again.');
      toast.error(errMsg);

      // Append assistant error notice
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          citations: [],
          guardrail_status: 'ERROR_NOTICE',
          isNew: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStarterPrompt = (prompt, category) => {
    if (category) {
      setActiveCategory(category);
    }
    handleSendMessage(prompt, category);
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success('Conversation cleared.');
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[600px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col overflow-hidden relative">
      {/* 1. Header with Domain Filter & Reset */}
      <ChatHeader
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onClearChat={handleClearChat}
        messageCount={messages.length}
      />

      {/* 2. Chat Messages Stream with Auto-scroll */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50/40">
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onSelectStarterPrompt={handleSelectStarterPrompt}
          onSelectFollowup={(fu) => handleSendMessage(fu)}
        />
      </div>

      {/* 3. Sticky Bottom Composer (ChatGPT style) */}
      <div className="border-t border-slate-200/80 bg-white p-3 sm:p-4 shrink-0 shadow-xs">
        <ChatInput
          onSendMessage={(msg) => handleSendMessage(msg)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
