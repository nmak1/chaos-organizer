import { useEffect, useCallback } from 'react';

export const useNotification = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, []);

  return { showNotification };
};