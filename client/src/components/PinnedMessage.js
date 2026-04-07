import React from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import { PushPin as PushPinIcon, Close as CloseIcon } from '@mui/icons-material';

function PinnedMessage({ message, onUnpin }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        mx: 2,
        mt: 1,
        backgroundColor: '#fff9c4',
        borderLeft: '4px solid #ffc107'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PushPinIcon fontSize="small" sx={{ color: '#ffc107' }} />
          <Typography variant="caption" color="textSecondary">
            Закрепленное сообщение
          </Typography>
        </Box>
        <IconButton size="small" onClick={onUnpin}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
        {message.type === 'text' ? message.content : `📎 ${message.filename || 'Файл'}`}
      </Typography>
      
      <Typography variant="caption" color="textSecondary">
        от {message.username}
      </Typography>
    </Paper>
  );
}

export default PinnedMessage;