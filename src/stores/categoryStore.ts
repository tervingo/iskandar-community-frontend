import { create } from 'zustand';
import { Category, CategoryCreate, CategoryUpdate } from '../types';
import { categoriesApi } from '../services/api';

interface CategoryStore {
  categories: Category[];
  allCategories: Category[]; // For admin - includes inactive
  loading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchAllCategories: () => Promise<void>; // Admin only
  createCategory: (category: CategoryCreate) => Promise<void>;
  updateCategory: (id: string, category: CategoryUpdate) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  initializeDefaults: () => Promise<void>;

  // Utility actions
  setError: (error: string | null) => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  allCategories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await categoriesApi.getAll();
      set({ categories, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch categories', loading: false });
    }
  },

  fetchAllCategories: async () => {
    set({ loading: true, error: null });
    try {
      const allCategories = await categoriesApi.getAllAdmin();
      set({ allCategories, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch categories', loading: false });
    }
  },

  createCategory: async (categoryData: CategoryCreate) => {
    set({ loading: true, error: null });
    try {
      const newCategory = await categoriesApi.create(categoryData);
      const { categories, allCategories } = get();
      set({ 
        categories: [...categories, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
        allCategories: [...allCategories, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false 
      });
    } catch (error) {
      set({ error: 'Failed to create category', loading: false });
    }
  },

  updateCategory: async (id: string, categoryData: CategoryUpdate) => {
    set({ loading: true, error: null });
    try {
      const updatedCategory = await categoriesApi.update(id, categoryData);
      const { categories, allCategories } = get();
      
      const updatedCategories = categories.map(cat => 
        cat.id === id ? updatedCategory : cat
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      const updatedAllCategories = allCategories.map(cat => 
        cat.id === id ? updatedCategory : cat
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      set({ 
        categories: updatedCategories, 
        allCategories: updatedAllCategories,
        loading: false 
      });
    } catch (error) {
      set({ error: 'Failed to update category', loading: false });
    }
  },

  deleteCategory: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await categoriesApi.delete(id);
      const { categories, allCategories } = get();
      const updatedCategories = categories.filter(cat => cat.id !== id);
      const updatedAllCategories = allCategories.filter(cat => cat.id !== id);
      set({ 
        categories: updatedCategories, 
        allCategories: updatedAllCategories,
        loading: false 
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete category';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  initializeDefaults: async () => {
    set({ loading: true, error: null });
    try {
      await categoriesApi.initializeDefaults();
      // Refresh categories after initialization
      await get().fetchCategories();
    } catch (error) {
      set({ error: 'Failed to initialize default categories', loading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
}));