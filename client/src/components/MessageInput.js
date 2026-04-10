import React, { useState, useRef, useCallback } from 'react';
import { Paper, TextField, IconButton, Box, Tooltip } from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  PhotoCamera as PhotoCameraIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

export const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    onSend('text', message);
    setMessage('');
  }, [message, onSend]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) onSend('file', null, file);
    e.target.value = '';
  }, [onSend]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => onSend('file', null, file));
  }, [onSend]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        onSend('audio', null, file);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') stopRecording();
      }, 30000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  }, [onSend]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const mapsUrl = `https://www.openstreetmap.org/?mlat=${position.coords.latitude}&mlon=${position.coords.longitude}#map=15/${position.coords.latitude}/${position.coords.longitude}`;
        const locationText = `📍 Моя геолокация: ${position.coords.latitude}, ${position.coords.longitude}\n${mapsUrl}`;
        onSend('text', locationText);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Не удалось получить геолокацию');
      }
    );
  }, [onSend]);

  return (
    <Paper elevation={3} sx={{ p: 2, m: 2 }} onDragOver={handleDragOver} onDrop={handleDrop}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Прикрепить файл">
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Фото/Видео">
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <PhotoCameraIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isRecording ? "Остановить запись" : "Записать аудио"}>
          <IconButton onClick={isRecording ? stopRecording : startRecording} color={isRecording ? 'error' : 'default'}>
            <MicIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Отправить геолокацию">
          <IconButton onClick={sendLocation}>
            <LocationIcon />
          </IconButton>
        </Tooltip>
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Введите сообщение... Команды бота: /help"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          variant="outlined"
          size="small"
        />
        
        <IconButton color="primary" onClick={handleSend}>
          <SendIcon />
        </IconButton>
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.txt"
        />
      </Box>
    </Paper>
  );
};