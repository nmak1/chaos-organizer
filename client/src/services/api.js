import axios from 'axios';

// Определяем URL в зависимости от окружения
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Замените на ваш реальный сервер (Heroku, Railway и т.д.)
    return 'https://chaos-organizer-server.herokuapp.com';
  }
  return 'http://localhost:3000';
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

export const api = {
  async getMessages(limit = 10, offset = 0) {
    const response = await apiClient.get('/messages', {
      params: { limit, offset }
    });
    return response.data;
  },
  
  async sendMessage(type, content, username) {
    const response = await apiClient.post('/messages', {
      type,
      content,
      username
    });
    return response.data;
  },
  
  async uploadFile(formData) {
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  async downloadFile(filename) {
    const response = await apiClient.get(`/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  async getPinned() {
    const response = await apiClient.get('/pinned');
    return response.data;
  },
  
  async pinMessage(message) {
    const response = await apiClient.post('/pinned', message);
    return response.data;
  },
  
  async unpinMessage() {
    const response = await apiClient.delete('/pinned');
    return response.data;
  },
  
  async getFavorites() {
    const response = await apiClient.get('/favorites');
    return response.data;
  },
  
  async toggleFavorite(messageId) {
    const response = await apiClient.post(`/favorites/${messageId}`);
    return response.data;
  },
  
  async searchMessages(query) {
    const response = await apiClient.get('/search', {
      params: { q: query }
    });
    return response.data;
  },
  
  async deleteMessage(messageId) {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  }
};

export const ws = {
  connect() {
    const WS_URL = process.env.NODE_ENV === 'production'
      ? 'wss://chaos-organizer-server.herokuapp.com'
      : 'ws://localhost:3000';
    return new WebSocket(WS_URL);
  }
};