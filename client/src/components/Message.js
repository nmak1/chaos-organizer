import React from 'react';
import { Typography, Box } from '@mui/material';

const API_URL = 'http://localhost:3000';

function Message({ message }) {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        // Обработка ссылок
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = message.content.split(urlRegex);
        
        return (
          <Typography variant="body1">
            {parts.map((part, index) => {
              if (part && part.match(urlRegex)) {
                return (
                  <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2', textDecoration: 'none' }}
                  >
                    {part}
                  </a>
                );
              }
              return part;
            })}
          </Typography>
        );
      
      case 'image':
        return (
          <Box sx={{ maxWidth: 300 }}>
            <img
              src={`${API_URL}${message.content}`}
              alt={message.filename}
              style={{ maxWidth: '100%', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => window.open(`${API_URL}${message.content}`, '_blank')}
            />
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {message.filename}
            </Typography>
          </Box>
        );
      
      case 'video':
        return (
          <Box sx={{ maxWidth: 400 }}>
            <video
              controls
              style={{ maxWidth: '100%', borderRadius: 4 }}
              src={`${API_URL}${message.content}`}
            />
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {message.filename}
            </Typography>
          </Box>
        );
      
      case 'audio':
        return (
          <Box sx={{ minWidth: 250 }}>
            <audio controls style={{ width: '100%' }} src={`${API_URL}${message.content}`} />
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {message.filename}
            </Typography>
          </Box>
        );
      
      default:
        return (
          <Typography variant="body1">
            📎 {message.filename || 'Файл'}
          </Typography>
        );
    }
  };
  
  return renderContent();
}

export default Message;