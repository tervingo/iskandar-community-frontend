import axios from 'axios';
import { Post, PostCreate, PostUpdate, Comment, CommentCreate, ChatMessage, ChatMessageCreate, FileItem, LoginRequest, LoginResponse, RegisterRequest, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Posts API
export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const response = await api.get('/posts');
    return response.data;
  },

  getById: async (id: string): Promise<Post> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  create: async (post: PostCreate): Promise<Post> => {
    const response = await api.post('/posts', post);
    return response.data;
  },

  update: async (id: string, post: PostUpdate): Promise<Post> => {
    const response = await api.put(`/posts/${id}`, post);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};

// Comments API
export const commentsApi = {
  getByPostId: async (postId: string): Promise<Comment[]> => {
    const response = await api.get(`/comments/post/${postId}`);
    return response.data;
  },

  create: async (postId: string, comment: CommentCreate): Promise<Comment> => {
    const response = await api.post(`/comments/post/${postId}`, comment);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};

// Chat API
export const chatApi = {
  getMessages: async (limit?: number): Promise<ChatMessage[]> => {
    const response = await api.get('/chat/messages', {
      params: { limit: limit || 50 }
    });
    return response.data;
  },

  createMessage: async (message: ChatMessageCreate): Promise<ChatMessage> => {
    const response = await api.post('/chat/messages', message);
    return response.data;
  },
};

// Files API
export const filesApi = {
  getAll: async (): Promise<FileItem[]> => {
    const response = await api.get('/files');
    return response.data;
  },

  getById: async (id: string): Promise<FileItem> => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  upload: async (file: File, uploadedBy: string, description?: string): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', uploadedBy);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },


  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createUser: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<RegisterRequest>): Promise<User> => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/auth/users/${userId}`);
  },

  toggleUserStatus: async (userId: string): Promise<void> => {
    await api.post(`/auth/users/${userId}/toggle-status`);
  },
};