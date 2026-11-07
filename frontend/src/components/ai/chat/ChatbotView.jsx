import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import aiService from '../../../services/ai/aiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import toast from 'react-hot-toast';

/**
 * ChatbotView Component
 * ChatGPT-like conversational interface grounded in NSU official documents & guides.
 */
export default function ChatbotView() {
  const [messages, setMessages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (userPrompt, overrideCategory) => {
    const categoryToSend = overrideCategory || activeCategory;

    // Append user message immediately
    const userMessageObj = { role: 'user', content: userPrompt };
    const nextMessages = [...messages, userMessageObj];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // Prepare conversation history for backend context (last 6 messages, capped length)
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role || 'user',
        content: (m.content || m.answer || '').slice(0, 1000),
      }));

      const response = await aiService.sendChatMessage({
        message: userPrompt,
        category: categoryToSend,
        conversation_history: historyPayload,
      });

      const botAnswer = response?.answer || response?.reply || '';
      if (response?.status === 'SUCCESS' || botAnswer) {
        const assistantMessageObj = {
          role: 'assistant',
          content: botAnswer,
          citations: response.citations || [],
          guardrail_status: response.guardrail_status || 'PASSED',
        };
        setMessages([...nextMessages, assistantMessageObj]);
      } else {
        throw new Error(response?.message || 'Received unexpected response from AI assistant.');
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
    <div className="flex flex-col h-[calc(100vh-10.5rem)] min-h-[580px] max-h-[820px] space-y-3">
      {/* 1. Header with Domain Filter & Reset */}
      <ChatHeader
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onClearChat={handleClearChat}
        messageCount={messages.length}
      />

      {/* 2. Message History Stream */}
      <div className="flex-1 min-h-0 bg-slate-50/50 rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden">
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onSelectStarterPrompt={handleSelectStarterPrompt}
        />

        {/* 3. Composer / Input Area */}
        <div className="p-3 bg-white border-t border-slate-200/80">
          <ChatInput
            onSendMessage={(msg) => handleSendMessage(msg)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
