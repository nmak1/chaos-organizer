import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef(null);

  const loadMessages = useCallback(async (offset = 0) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await api.getMessages(10, offset);
      
      setMessages(prev => {
        if (offset === 0) {
          return response.messages;
        } else {
          // Избегаем дублирования
          const newMessages = [...response.messages, ...prev];
          return newMessages;
        }
      });
      
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Проверяем, нет ли уже такого сообщения
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  return {
    messages,
    hasMore,
    loading,
    loadMoreRef,
    loadMessages,
    addMessage,
    deleteMessage
  };
};