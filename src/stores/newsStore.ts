import { create } from 'zustand';
import { News, NewsUpdate } from '../types';
import { newsApi } from '../services/api';

interface NewsStore {
  news: News[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchNews: () => Promise<void>;
  createNews: (title: string, url: string, comment?: string) => Promise<void>;
  updateNews: (id: string, updates: NewsUpdate) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  news: [],
  loading: false,
  error: null,

  fetchNews: async () => {
    try {
      set({ loading: true, error: null });
      const news = await newsApi.getAll();
      set({ news, loading: false });
    } catch (error: any) {
      console.error('Error fetching news:', error);
      set({
        error: error.response?.data?.detail || 'Error al cargar las noticias',
        loading: false
      });
    }
  },

  createNews: async (title: string, url: string, comment?: string) => {
    try {
      set({ loading: true, error: null });
      const newNews = await newsApi.create({ title, url, comment });
      const currentNews = get().news;
      set({
        news: [newNews, ...currentNews], // Add to the beginning (newest first)
        loading: false
      });
    } catch (error: any) {
      console.error('Error creating news:', error);
      set({
        error: error.response?.data?.detail || 'Error al crear la noticia',
        loading: false
      });
      throw error;
    }
  },

  updateNews: async (id: string, updates: NewsUpdate) => {
    try {
      set({ loading: true, error: null });
      const updatedNews = await newsApi.update(id, updates);
      const currentNews = get().news;
      set({
        news: currentNews.map(item => item.id === id ? updatedNews : item),
        loading: false
      });
    } catch (error: any) {
      console.error('Error updating news:', error);
      set({
        error: error.response?.data?.detail || 'Error al actualizar la noticia',
        loading: false
      });
      throw error;
    }
  },

  deleteNews: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await newsApi.delete(id);
      const currentNews = get().news;
      set({
        news: currentNews.filter(item => item.id !== id),
        loading: false
      });
    } catch (error: any) {
      console.error('Error deleting news:', error);
      set({
        error: error.response?.data?.detail || 'Error al eliminar la noticia',
        loading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));