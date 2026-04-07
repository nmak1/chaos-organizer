import React from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import Message from './Message';

function MessageList({
  messages,
  favorites,
  onPin,
  onFavorite,
  onDownload,
  pinnedMessageId,
  loadMoreRef,
  messagesEndRef
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedMessage, setSelectedMessage] = React.useState(null);

  const handleMenuOpen = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

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
      <div ref={loadMoreRef} style={{ height: '1px' }} />
      
      {messages.map((message) => (
        <Box
          key={message.id}
          sx={{
            display: 'flex',
            justifyContent: message.userId === 'bot' ? 'flex-start' : 'flex-end',
            mb: 2,
            position: 'relative'
          }}
        >
          <Paper
            elevation={1}
            sx={{
              maxWidth: '70%',
              p: 1,
              backgroundColor: message.userId === 'bot' ? '#f5f5f5' : '#e3f2fd',
              position: 'relative'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="textSecondary">
                {message.username} • {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
              <IconButton size="small" onClick={(e) => handleMenuOpen(e, message)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Message message={message} />
          </Paper>
        </Box>
      ))}
      
      <div ref={messagesEndRef} />
      
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => {
          onPin(selectedMessage);
          handleMenuClose();
        }}>
          {pinnedMessageId === selectedMessage?.id ? (
            <>
              <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
              Открепить
            </>
          ) : (
            <>
              <PushPinOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Закрепить
            </>
          )}
        </MenuItem>
        
        <MenuItem onClick={() => {
          onFavorite(selectedMessage?.id);
          handleMenuClose();
        }}>
          {favorites.has(selectedMessage?.id) ? (
            <>
              <FavoriteIcon fontSize="small" sx={{ mr: 1, color: 'red' }} />
              Из избранного
            </>
          ) : (
            <>
              <FavoriteBorderIcon fontSize="small" sx={{ mr: 1 }} />
              В избранное
            </>
          )}
        </MenuItem>
        
        {(selectedMessage?.type === 'image' || selectedMessage?.type === 'video' || 
          selectedMessage?.type === 'audio' || selectedMessage?.type === 'file') && (
          <MenuItem onClick={() => {
            const filename = selectedMessage.content.split('/').pop();
            onDownload(filename);
            handleMenuClose();
          }}>
            <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
            Скачать
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default MessageList;