import { create } from 'zustand';
import { FileItem } from '../types';
import { filesApi } from '../services/api';

interface FileStore {
  files: FileItem[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFiles: () => Promise<void>;
  uploadFile: (file: File, uploadedBy: string, description?: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  loading: false,
  error: null,

  fetchFiles: async () => {
    set({ loading: true, error: null });
    try {
      const files = await filesApi.getAll();
      set({ files, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch files', loading: false });
    }
  },

  uploadFile: async (file: File, uploadedBy: string, description?: string) => {
    set({ loading: true, error: null });
    try {
      const newFile = await filesApi.upload(file, uploadedBy, description);
      const { files } = get();
      set({ files: [newFile, ...files], loading: false });
    } catch (error) {
      set({ error: 'Failed to upload file', loading: false });
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
      set({ error: 'Failed to delete file', loading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
}));