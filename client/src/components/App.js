import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Paper,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Star as StarIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  PushPin as PushPinIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Audiotrack as AudioIcon,
  Videocam as VideoIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PinnedMessage from './PinnedMessage';
import { api, ws } from '../services/api';
import './App.css';

const DRAWER_WIDTH = 280;

function App() {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeCategory, setActiveCategory] = useState('all');
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Экспорт истории чата
  const exportChat = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content,
        username: m.username,
        timestamp: m.timestamp,
        date: new Date(m.timestamp).toLocaleString(),
        ...(m.filename && { filename: m.filename }),
        ...(m.filesize && { filesize: m.filesize })
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chaos-organizer-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSnackbar('История чата экспортирована', 'success');
  };

  // Загрузка сообщений
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
      showSnackbar('Ошибка загрузки сообщений', 'error');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Загрузка закрепленного сообщения
  const loadPinned = useCallback(async () => {
    try {
      const pinned = await api.getPinned();
      setPinnedMessage(pinned);
    } catch (error) {
      console.error('Error loading pinned:', error);
    }
  }, []);

  // Загрузка избранного
  const loadFavorites = useCallback(async () => {
    try {
      const favs = await api.getFavorites();
      setFavorites(new Set(favs.map(f => f.id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Отправка сообщения
  const sendMessage = async (type, content, file = null) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', 'User');
        await api.uploadFile(formData);
        showSnackbar('Файл отправлен', 'success');
      } else {
        if (content.trim().startsWith('/')) {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'command',
              command: content
            }));
            showSnackbar('Команда отправлена боту', 'info');
          } else {
            await api.sendMessage(type, content, 'User');
            showSnackbar('Сообщение отправлено', 'success');
          }
        } else {
          await api.sendMessage(type, content, 'User');
          showSnackbar('Сообщение отправлено', 'success');
        }
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Ошибка отправки', 'error');
    }
  };

  // Закрепление сообщения
  const handlePinMessage = async (message) => {
    try {
      if (pinnedMessage && pinnedMessage.id === message.id) {
        await api.unpinMessage();
        setPinnedMessage(null);
        showSnackbar('Сообщение откреплено', 'info');
      } else {
        await api.pinMessage(message);
        setPinnedMessage(message);
        showSnackbar('Сообщение закреплено', 'success');
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      showSnackbar('Ошибка закрепления сообщения', 'error');
    }
  };

  // Добавление в избранное
  const handleFavorite = async (messageId) => {
    try {
      const result = await api.toggleFavorite(messageId);
      
      setFavorites(prev => {
        const newSet = new Set(prev);
        if (result.favorited) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });
      
      showSnackbar(result.favorited ? 'Добавлено в избранное' : 'Удалено из избранного', 'success');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Поиск
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearch(false);
      return;
    }
    
    try {
      const results = await api.searchMessages(searchQuery);
      setSearchResults(results);
      setShowSearch(true);
    } catch (error) {
      console.error('Error searching:', error);
      showSnackbar('Ошибка поиска', 'error');
    }
  };

  // Скачивание файла
  const handleDownload = async (filename) => {
    try {
      const blob = await api.downloadFile(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSnackbar('Файл скачан', 'success');
    } catch (error) {
      console.error('Error downloading file:', error);
      showSnackbar('Ошибка скачивания файла', 'error');
    }
  };

  // Фильтрация по категориям
  const getFilteredMessages = () => {
    let filtered = showSearch ? searchResults : messages;
    
    if (activeCategory === 'favorites') {
      filtered = filtered.filter(m => favorites.has(m.id));
    } else if (activeCategory !== 'all') {
      filtered = filtered.filter(m => m.type === activeCategory);
    }
    
    return filtered;
  };

  // WebSocket обработка
  useEffect(() => {
    wsRef.current = ws.connect();
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_message':
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
          break;
        case 'pin_updated':
          setPinnedMessage(data.message);
          break;
        case 'favorites_updated':
          setFavorites(prev => {
            const newSet = new Set(prev);
            if (data.favorited) {
              newSet.add(data.messageId);
            } else {
              newSet.delete(data.messageId);
            }
            return newSet;
          });
          break;
        case 'message_deleted':
          setMessages(prev => prev.filter(m => m.id !== data.messageId));
          break;
      }
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Инициализация
  useEffect(() => {
    loadMessages(0);
    loadPinned();
    loadFavorites();
  }, [loadMessages, loadPinned, loadFavorites]);

  // Бесконечная прокрутка
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMessages(messages.length);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, loading, messages.length, loadMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const categories = [
    { id: 'all', label: 'Все', icon: <ChatIcon /> },
    { id: 'favorites', label: 'Избранное', icon: <FavoriteIcon /> },
    { id: 'image', label: 'Изображения', icon: <ImageIcon /> },
    { id: 'video', label: 'Видео', icon: <VideoIcon /> },
    { id: 'audio', label: 'Аудио', icon: <AudioIcon /> },
    { id: 'file', label: 'Файлы', icon: <FileIcon /> }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Chaos Organizer 🤖
          </Typography>
          
          {/* ПОЛЕ ПОИСКА */}
          <TextField
            size="small"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ mr: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon sx={{ color: 'white' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* КНОПКА ЭКСПОРТА - ДОБАВЛЕНА ЗДЕСЬ, ПОСЛЕ ПОЛЯ ПОИСКА */}
          <Tooltip title="Экспорт истории">
            <IconButton color="inherit" onClick={exportChat}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {categories.map((category) => (
              <ListItem
                button
                key={category.id}
                selected={activeCategory === category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setShowSearch(false);
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>{category.icon}</ListItemIcon>
                <ListItemText primary={category.label} />
                {category.id === 'favorites' && favorites.size > 0 && (
                  <Badge badgeContent={favorites.size} color="primary" />
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Toolbar />
        
        {pinnedMessage && (
          <PinnedMessage
            message={pinnedMessage}
            onUnpin={() => handlePinMessage(pinnedMessage)}
          />
        )}
        
        <MessageList
          messages={getFilteredMessages()}
          favorites={favorites}
          onPin={handlePinMessage}
          onFavorite={handleFavorite}
          onDownload={handleDownload}
          pinnedMessageId={pinnedMessage?.id}
          loadMoreRef={loadMoreRef}
          messagesEndRef={messagesEndRef}
        />
        
        <MessageInput onSend={sendMessage} />
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;