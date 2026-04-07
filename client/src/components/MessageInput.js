import React, { useState, useRef, useEffect } from 'react';
import { Paper, TextField, IconButton, Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  PhotoCamera as PhotoCameraIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon,
  NotificationsActive as NotificationsIcon
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';

function MessageInput({ onSend }) {
  const [message, setMessage] = useState('');
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Проверка на напоминание при отправке
  const checkForReminder = (text) => {
    const remindRegex = /@remind\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.+)/i;
    const match = text.match(remindRegex);
    
    if (match) {
      const [, date, time, reminderContent] = match;
      const reminderDateTimeStr = `${date}T${time}:00`;
      const reminderDate = new Date(reminderDateTimeStr);
      
      if (reminderDate > new Date()) {
        scheduleReminder(reminderContent, reminderDate);
        return true;
      }
    }
    return false;
  };

  // Планирование напоминания
  const scheduleReminder = (content, date) => {
    const timeUntil = date.getTime() - Date.now();
    
    if (timeUntil > 0) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('🔔 Напоминание от Chaos Organizer', {
            body: content,
            icon: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png'
          });
        }
        onSend('text', `🔔 НАПОМИНАНИЕ: ${content}`);
      }, timeUntil);
      
      onSend('text', `✅ Напоминание установлено на ${date.toLocaleString()}: "${content}"`);
      return true;
    }
    return false;
  };

  const handleSend = () => {
    if (message.trim()) {
      if (checkForReminder(message)) {
        setMessage('');
        return;
      }
      
      if (message.startsWith('/')) {
        onSend('text', message);
      } else {
        onSend('text', message);
      }
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSend('file', null, file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      onSend('file', null, file);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
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
        if (mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const mapsUrl = `https://www.openstreetmap.org/?mlat=${position.coords.latitude}&mlon=${position.coords.longitude}#map=15/${position.coords.latitude}/${position.coords.longitude}`;
        const locationText = `📍 Моя геолокация: ${position.coords.latitude}, ${position.coords.longitude}\n${mapsUrl}`;
        onSend('text', locationText);
      }, (error) => {
        console.error('Error getting location:', error);
        alert('Не удалось получить геолокацию');
      });
    } else {
      alert('Геолокация не поддерживается');
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, m: 2, position: 'relative' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <Tooltip title="Прикрепить файл">
          <IconButton onClick={() => fileInputRef.current.click()}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Фото/Видео">
          <IconButton onClick={() => fileInputRef.current.click()}>
            <PhotoCameraIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isRecording ? "Остановить запись" : "Записать аудио"}>
          <IconButton
            onClick={isRecording ? stopRecording : startRecording}
            color={isRecording ? 'error' : 'default'}
          >
            <MicIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Отправить геолокацию">
          <IconButton onClick={sendLocation}>
            <LocationIcon />
          </IconButton>
        </Tooltip>
        
        {/* КНОПКА НАПОМИНАНИЯ */}
        <Tooltip title="Напоминание (формат: @remind 2024-12-31 23:59 текст)">
          <IconButton onClick={() => setReminderDialogOpen(true)}>
            <NotificationsIcon />
          </IconButton>
        </Tooltip>
        
        {/* КНОПКА EMOJI - ВОТ ЗДЕСЬ ОНА ДОБАВЛЯЕТСЯ */}
        <Tooltip title="Добавить Emoji">
          <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <span role="img" aria-label="emoji" style={{ fontSize: '24px' }}>😊</span>
          </IconButton>
        </Tooltip>
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder='Введите сообщение... 📝 Формат напоминания: @remind 2024-12-31 23:59 текст'
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
      
      {/* EMOJI PICKER - ПОЯВЛЯЕТСЯ ЗДЕСЬ ПРИ НАЖАТИИ НА КНОПКУ */}
      {showEmojiPicker && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: '80px', 
          right: '20px', 
          zIndex: 1000 
        }}>
          <EmojiPicker 
            onEmojiClick={(emoji) => {
              setMessage(prev => prev + emoji.emoji);
              setShowEmojiPicker(false);
            }} 
          />
        </Box>
      )}
      
      {/* ДИАЛОГ НАПОМИНАНИЯ */}
      <Dialog open={reminderDialogOpen} onClose={() => setReminderDialogOpen(false)}>
        <DialogTitle>Установить напоминание</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Текст напоминания"
            fullWidth
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Дата и время"
            type="datetime-local"
            fullWidth
            value={reminderDateTime}
            onChange={(e) => setReminderDateTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialogOpen(false)}>Отмена</Button>
          <Button onClick={() => {
            if (reminderText && reminderDateTime) {
              const date = new Date(reminderDateTime);
              scheduleReminder(reminderText, date);
              setReminderDialogOpen(false);
              setReminderText('');
              setReminderDateTime('');
            }
          }} color="primary">
            Установить
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MessageInput;