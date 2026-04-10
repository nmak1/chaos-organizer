import { useState, useCallback, useRef, useEffect } from 'react';
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
      
      if (offset === 0) {
        setMessages(response.messages);
      } else {
        setMessages(prev => [...response.messages, ...prev]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
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