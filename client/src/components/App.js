import React, { useState, useCallback, useEffect } from 'react';
import {
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
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Audiotrack as AudioIcon,
  Videocam as VideoIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

import { useMessages } from '../hooks/useMessages';
import { useFavorites } from '../hooks/useFavorites';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../hooks/useNotification';
import { api } from '../services/api';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { PinnedMessage } from './PinnedMessage';

const DRAWER_WIDTH = 280;

const categories = [
  { id: 'all', label: 'Все', icon: ChatIcon },
  { id: 'favorites', label: 'Избранное', icon: FavoriteIcon },
  { id: 'image', label: 'Изображения', icon: ImageIcon },
  { id: 'video', label: 'Видео', icon: VideoIcon },
  { id: 'audio', label: 'Аудио', icon: AudioIcon },
  { id: 'file', label: 'Файлы', icon: FileIcon }
];

export const App = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const { messages, hasMore, loading, loadMoreRef, loadMessages, addMessage, deleteMessage } = useMessages();
  const { favorites, loadFavorites, toggleFavorite } = useFavorites();
  const { pinnedMessage, loadPinned, pinMessage } = usePinnedMessage();
  const { showNotification } = useNotification();

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'new_message':
        addMessage(data.message);
        if (data.message.isBot && data.message.content.includes('НАПОМИНАНИЕ')) {
          showNotification('Напоминание', data.message.content);
        }
        break;
      case 'message_deleted':
        deleteMessage(data.messageId);
        break;
      default:
        break;
    }
  }, [addMessage, deleteMessage, showNotification]);

  const { sendMessage: wsSend } = useWebSocket(handleWebSocketMessage);

  // Загрузка начальных данных - только один раз при монтировании
  useEffect(() => {
    loadMessages(0);
    loadPinned();
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив - только при монтировании

  const sendMessage = useCallback(async (type, content, file = null) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('username', 'User');
        await api.uploadFile(formData);
        showSnackbar('Файл отправлен', 'success');
      } else if (content.trim().startsWith('/')) {
        wsSend({ type: 'command', command: content });
        showSnackbar('Команда отправлена боту', 'info');
      } else {
        await api.sendMessage(type, content, 'User');
        showSnackbar('Сообщение отправлено', 'success');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Ошибка отправки', 'error');
    }
  }, [wsSend, showSnackbar]);

  const handleSearch = useCallback(async () => {
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
  }, [searchQuery, showSnackbar]);

  const exportChat = useCallback(() => {
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
        ...(m.filename && { filename: m.filename })
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
  }, [messages, showSnackbar]);

  const getFilteredMessages = useCallback(() => {
    if (showSearch) return searchResults;
    if (activeCategory === 'favorites') {
      return messages.filter(m => favorites.has(m.id));
    }
    if (activeCategory !== 'all') {
      return messages.filter(m => m.type === activeCategory);
    }
    return messages;
  }, [showSearch, searchResults, activeCategory, messages, favorites]);

  const filteredMessages = getFilteredMessages();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Chaos Organizer 🤖
          </Typography>
          
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
          
          <Tooltip title="Экспорт истории">
            <IconButton color="inherit" onClick={exportChat}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Toolbar />
        <Box sx={{ width: DRAWER_WIDTH, overflow: 'auto' }}>
          <List>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
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
                  <ListItemIcon><Icon /></ListItemIcon>
                  <ListItemText primary={category.label} />
                  {category.id === 'favorites' && favorites.size > 0 && (
                    <Badge badgeContent={favorites.size} color="primary" />
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Toolbar />
        
        {pinnedMessage && (
          <PinnedMessage message={pinnedMessage} onUnpin={() => pinMessage(pinnedMessage)} />
        )}
        
        <MessageList
          messages={filteredMessages}
          hasMore={hasMore}
          loading={loading}
          loadMoreRef={loadMoreRef}
          favorites={favorites}
          pinnedMessageId={pinnedMessage?.id}
          onPin={pinMessage}
          onFavorite={toggleFavorite}
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
};