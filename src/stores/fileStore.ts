import { create } from 'zustand';
import { FileItem } from '../types';
import { filesApi } from '../services/api';

interface FileStore {
  files: FileItem[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFiles: (categoryId?: string) => Promise<void>;
  uploadFile: (file: File, uploadedBy: string, description?: string, categoryId?: string) => Promise<void>;
  addUrl: (url: string, uploadedBy: string, description?: string, categoryId?: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  loading: false,
  error: null,

  fetchFiles: async (categoryId?: string) => {
    set({ loading: true, error: null });
    try {
      const files = await filesApi.getAll(categoryId);
      set({ files, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar los archivos', loading: false });
    }
  },

  uploadFile: async (file: File, uploadedBy: string, description?: string, categoryId?: string) => {
    set({ loading: true, error: null });
    try {
      const newFile = await filesApi.upload(file, uploadedBy, description, categoryId);
      const { files } = get();
      set({ files: [newFile, ...files], loading: false });
    } catch (error) {
      set({ error: 'Error al subir el archivo', loading: false });
    }
  },

  addUrl: async (url: string, uploadedBy: string, description?: string, categoryId?: string) => {
    set({ loading: true, error: null });
    try {
      const newFile = await filesApi.addUrl(url, uploadedBy, description, categoryId);
      const { files } = get();
      set({ files: [newFile, ...files], loading: false });
    } catch (error) {
      set({ error: 'Error al agregar la URL', loading: false });
    }
  },

  deleteFile: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await filesApi.delete(id);
      const { files } = get();
      const updatedFiles = files.filter(file => file.id !== id);
      set({ files: updatedFiles, loading: false });
    } catch (error) {
      set({ error: 'Error al eliminar el archivo', loading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
}));