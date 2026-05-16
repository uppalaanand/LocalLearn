import { useState, useEffect } from 'react';
import { favoriteService } from '../services/dataServices';

// Module-level variable to track the last known state across all hook instances
// to prevent infinite event loops.
let lastKnownFavorites = localStorage.getItem('favoriteClasses') || '[]';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favoriteClasses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const currentString = JSON.stringify(favorites);
    // Only update storage and dispatch if this instance actually changed the global state
    if (currentString !== lastKnownFavorites) {
      lastKnownFavorites = currentString;
      localStorage.setItem('favoriteClasses', currentString);
      window.dispatchEvent(new Event('favoritesChanged'));
    }
  }, [favorites]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent | Event) => {
      const saved = localStorage.getItem('favoriteClasses') || '[]';
      
      // Update local state if it differs from what's in storage
      if (saved !== JSON.stringify(favorites)) {
        try {
          const nextFavorites = JSON.parse(saved);
          lastKnownFavorites = saved; // Keep the global tracker in sync
          setFavorites(nextFavorites);
        } catch (err) {
          console.error('Failed to parse favorites from storage', err);
        }
      }
    };

    window.addEventListener('favoritesChanged', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('favoritesChanged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [favorites]);

  const toggleFavorite = async (classId: string) => {
    // Optimistic local update
    setFavorites(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );

    // Sync with backend if authenticated
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await favoriteService.toggleFavorite(classId);
      } catch (error) {
        // Revert on error
        console.error('Failed to sync favorite with server:', error);
      }
    }
  };

  const isFavorite = (classId: string) => favorites.includes(classId);

  return { favorites, toggleFavorite, isFavorite };
}
