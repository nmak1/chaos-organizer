import React from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import { PushPin as PushPinIcon, Close as CloseIcon } from '@mui/icons-material';
import { MessageRenderer } from './MessageRenderer';

export const PinnedMessage = ({ message, onUnpin }) => {
  if (!message) return null;

  return (
    <Paper elevation={2} sx={{ p: 1, mx: 2, mt: 1, backgroundColor: '#fff9c4', borderLeft: '4px solid #ffc107' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PushPinIcon fontSize="small" sx={{ color: '#ffc107' }} />
          <Typography variant="caption" color="textSecondary">Закрепленное сообщение</Typography>
        </Box>
        <IconButton size="small" onClick={onUnpin}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      
      <MessageRenderer message={message} />
      
      <Typography variant="caption" color="textSecondary">от {message.username}</Typography>
    </Paper>
  );
};