import React, { useState, memo } from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem, CircularProgress } from '@mui/material';
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { MessageRenderer } from './MessageRenderer';

const MessageItem = memo(({ message, isPinned, isFavorite, onPin, onFavorite }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handlePin = () => {
    onPin(message);
    handleMenuClose();
  };

  const handleFavorite = () => {
    onFavorite(message.id);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: message.userId === 'bot' ? 'flex-start' : 'flex-end', mb: 2 }}>
      <Paper elevation={1} sx={{ maxWidth: '70%', p: 1, backgroundColor: message.userId === 'bot' ? '#f5f5f5' : '#e3f2fd' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="textSecondary">
            {message.username} • {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <MessageRenderer message={message} />
      </Paper>
      
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handlePin}>
          {isPinned ? <PushPinIcon fontSize="small" sx={{ mr: 1 }} /> : <PushPinOutlinedIcon fontSize="small" sx={{ mr: 1 }} />}
          {isPinned ? 'Открепить' : 'Закрепить'}
        </MenuItem>
        <MenuItem onClick={handleFavorite}>
          {isFavorite ? <FavoriteIcon fontSize="small" sx={{ mr: 1, color: 'red' }} /> : <FavoriteBorderIcon fontSize="small" sx={{ mr: 1 }} />}
          {isFavorite ? 'Из избранного' : 'В избранное'}
        </MenuItem>
      </Menu>
    </Box>
  );
});

export const MessageList = memo(({ messages, hasMore, loading, loadMoreRef, favorites, pinnedMessageId, onPin, onFavorite }) => {
  if (messages.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          Нет сообщений. Напишите что-нибудь!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      {hasMore && <div ref={loadMoreRef} style={{ height: '1px' }} />}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={30} /></Box>}
      
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isPinned={pinnedMessageId === message.id}
          isFavorite={favorites.has(message.id)}
          onPin={onPin}
          onFavorite={onFavorite}
        />
      ))}
    </Box>
  );
});