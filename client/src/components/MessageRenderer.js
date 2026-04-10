import React from 'react';
import { Typography, Box } from '@mui/material';

const API_URL = 'http://localhost:3000';

const TextMessage = ({ content }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return (
    <Typography variant="body1">
      {parts.map((part, index) => {
        if (part?.match(urlRegex)) {
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
};

const ImageMessage = ({ content, filename }) => (
  <Box sx={{ maxWidth: 300 }}>
    <img
      src={`${API_URL}${content}`}
      alt={filename}
      style={{ maxWidth: '100%', borderRadius: 4, cursor: 'pointer' }}
      onClick={() => window.open(`${API_URL}${content}`, '_blank')}
    />
    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
      {filename}
    </Typography>
  </Box>
);

const VideoMessage = ({ content, filename }) => (
  <Box sx={{ maxWidth: 400 }}>
    <video
      controls
      style={{ maxWidth: '100%', borderRadius: 4 }}
      src={`${API_URL}${content}`}
    />
    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
      {filename}
    </Typography>
  </Box>
);

const AudioMessage = ({ content, filename }) => (
  <Box sx={{ minWidth: 250 }}>
    <audio controls style={{ width: '100%' }} src={`${API_URL}${content}`} />
    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
      {filename}
    </Typography>
  </Box>
);

const FileMessage = ({ filename }) => (
  <Typography variant="body1">
    📎 {filename || 'Файл'}
  </Typography>
);

// Хеш-таблица для типов сообщений
const messageRenderers = {
  text: TextMessage,
  image: ImageMessage,
  video: VideoMessage,
  audio: AudioMessage,
  file: FileMessage
};

export const MessageRenderer = ({ message }) => {
  const Renderer = messageRenderers[message.type] || messageRenderers.file;
  return <Renderer {...message} />;
};