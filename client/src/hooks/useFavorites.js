import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(new Set());

  const loadFavorites = useCallback(async () => {
    try {
      const favs = await api.getFavorites();
      setFavorites(new Set(favs.map(f => f.id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  const toggleFavorite = useCallback(async (messageId) => {
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
      return result.favorited;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return { favorites, toggleFavorite };
};