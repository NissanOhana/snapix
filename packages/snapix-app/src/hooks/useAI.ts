import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  fallback?: boolean;
}

export const useAI = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Chat mutation
  const chatMutation = trpc.ai.chat.useMutation();

  // Clear conversation mutation
  const clearConversationMutation = trpc.ai.clearConversation.useMutation();

  // Get AI health
  const {
    data: healthData,
    isLoading: isLoadingHealth,
  } = trpc.ai.getHealth.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get AI stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = trpc.ai.getStats.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Get quick help suggestions
  const {
    data: quickHelpData,
  } = trpc.ai.getQuickHelp.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1 hour (these don't change often)
  });

  const sendMessage = async (message: string, context?: any) => {
    if (!message.trim() || chatMutation.isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: message.trim(),
        context: context || {},
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        fallback: response.fallback,
      };

      // Add assistant response to chat
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Add fallback error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'מצטער, אני נתקל בבעיה זמנית. אנא נסה שוב או פנה לתמיכה.',
        timestamp: new Date().toISOString(),
        fallback: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearConversation = async () => {
    try {
      await clearConversationMutation.mutateAsync();
      setMessages([]);
    } catch (error) {
      console.error('Clear conversation error:', error);
    }
  };

  const sendQuickMessage = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Helper to get conversation context for better AI responses
  const getConversationContext = () => {
    return {
      messageCount: messages.length,
      lastMessages: messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content.substring(0, 100), // Truncate for context
      })),
    };
  };

  return {
    // Messages and conversation
    messages,
    isTyping,
    conversationLength: messages.length,
    
    // Loading states
    isSending: chatMutation.isLoading,
    isClearing: clearConversationMutation.isLoading,
    isLoadingHealth,
    isLoadingStats,
    
    // AI service status
    aiHealth: (healthData?.success && 'data' in healthData) ? healthData.data : null,
    aiStats: (statsData?.success && 'data' in statsData) ? statsData.data : null,
    quickHelp: quickHelpData?.data || [],
    
    // Actions
    sendMessage,
    clearConversation,
    sendQuickMessage,
    
    // Helpers
    getConversationContext,
    
    // Errors
    chatError: chatMutation.error,
    clearError: clearConversationMutation.error,
  };
};