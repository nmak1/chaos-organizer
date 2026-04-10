import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const usePinnedMessage = () => {
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const loadPinned = useCallback(async () => {
    try {
      const pinned = await api.getPinned();
      setPinnedMessage(pinned);
    } catch (error) {
      console.error('Error loading pinned:', error);
    }
  }, []);

  const pinMessage = useCallback(async (message) => {
    try {
      if (pinnedMessage?.id === message.id) {
        await api.unpinMessage();
        setPinnedMessage(null);
        return false;
      } else {
        await api.pinMessage(message);
        setPinnedMessage(message);
        return true;
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      throw error;
    }
  }, [pinnedMessage]);

  return { pinnedMessage, loadPinned, pinMessage };
};