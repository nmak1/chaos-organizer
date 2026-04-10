import { useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3000';

export const useWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Обновляем ref при изменении onMessage
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    wsRef.current = new WebSocket(WS_URL);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessageRef.current?.(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Пустой массив зависимостей - подключаемся только один раз

  return { sendMessage };
};