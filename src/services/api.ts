import axios from 'axios';
import { Post, PostCreate, PostUpdate, PostPublish, PostPinPriority, Comment, CommentCreate, CommentUpdate, ChatMessage, ChatMessageCreate, FileItem, LoginRequest, LoginResponse, RegisterRequest, User, PasswordChangeRequest, Category, CategoryCreate, CategoryUpdate, News, NewsCreate, NewsUpdate, UserActivityLog, ActivityLogFilters, ActivityStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Only use sessionStorage for authentication
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  getAllAdmin: async (): Promise<Category[]> => {
    const response = await api.get('/categories/all');
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (category: CategoryCreate): Promise<Category> => {
    const response = await api.post('/categories', category);
    return response.data;
  },

  update: async (id: string, category: CategoryUpdate): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  initializeDefaults: async (): Promise<void> => {
    await api.post('/categories/initialize');
  },
};

// Posts API
export const postsApi = {
  getAll: async (categoryId?: string): Promise<Post[]> => {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await api.get('/posts', { params });
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

  getMyDrafts: async (): Promise<Post[]> => {
    const response = await api.get('/posts/drafts/my');
    return response.data;
  },

  getAllIncludingDrafts: async (categoryId?: string, includeUnpublished: boolean = false): Promise<Post[]> => {
    const params: any = {};
    if (categoryId) params.category_id = categoryId;
    if (includeUnpublished) params.include_unpublished = true;
    const response = await api.get('/posts/all', { params });
    return response.data;
  },

  publish: async (id: string, publishData: PostPublish): Promise<Post> => {
    const response = await api.put(`/posts/${id}/publish`, publishData);
    return response.data;
  },

  updatePinPriority: async (id: string, priorityData: PostPinPriority): Promise<Post> => {
    const response = await api.put(`/posts/${id}/pin-priority`, priorityData);
    return response.data;
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

  update: async (id: string, comment: CommentUpdate): Promise<Comment> => {
    const response = await api.put(`/comments/${id}`, comment);
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
  getAll: async (categoryId?: string): Promise<FileItem[]> => {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await api.get('/files', { params });
    return response.data;
  },

  getById: async (id: string): Promise<FileItem> => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  upload: async (file: File, uploadedBy: string, description?: string, categoryId?: string): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', uploadedBy);
    if (description) {
      formData.append('description', description);
    }
    if (categoryId) {
      formData.append('category_id', categoryId);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  addUrl: async (url: string, uploadedBy: string, description?: string, categoryId?: string): Promise<FileItem> => {
    const urlData = {
      url,
      uploaded_by: uploadedBy,
      description: description || '',
      category_id: categoryId
    };

    const response = await api.post('/files/url', urlData);
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

  logout: async (): Promise<any> => {
    console.log('authApi.logout: Making POST request to /auth/logout');
    const response = await api.post('/auth/logout');
    console.log('authApi.logout: Response received:', response.data);
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

  changePassword: async (passwordData: PasswordChangeRequest): Promise<void> => {
    await api.post('/auth/change-password', passwordData);
  },

  heartbeat: async (): Promise<void> => {
    await api.post('/auth/heartbeat');
  },

  getOnlineUsers: async (): Promise<{online_users: User[], count: number}> => {
    const response = await api.get('/auth/online-users');
    return response.data;
  },
};

// News API
export const newsApi = {
  getAll: async (): Promise<News[]> => {
    const response = await api.get('/news');
    return response.data;
  },

  getById: async (id: string): Promise<News> => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },

  create: async (news: NewsCreate): Promise<News> => {
    const response = await api.post('/news', news);
    return response.data;
  },

  update: async (id: string, news: NewsUpdate): Promise<News> => {
    const response = await api.put(`/news/${id}`, news);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/news/${id}`);
  },

  initialize: async (): Promise<{ message: string; sample_article_id?: string; collection_name: string }> => {
    const response = await api.post('/news/initialize');
    return response.data;
  },
};

// Activity Logs API
export const activityLogsApi = {
  getAll: async (filters?: ActivityLogFilters): Promise<UserActivityLog[]> => {
    const params = new URLSearchParams();
    if (filters?.username) params.append('username', filters.username);
    if (filters?.event_type) params.append('event_type', filters.event_type);
    if (filters?.success !== undefined) params.append('success', filters.success.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/activity-logs?${params.toString()}`);
    return response.data;
  },

  getStats: async (days: number = 30): Promise<ActivityStats> => {
    const response = await api.get(`/activity-logs/stats?days=${days}`);
    return response.data;
  },

  getUserLogs: async (username: string, limit: number = 50): Promise<UserActivityLog[]> => {
    const response = await api.get(`/activity-logs/users/${username}?limit=${limit}`);
    return response.data;
  },

  cleanup: async (days: number = 90): Promise<{ message: string; deleted_count: number; cutoff_date: string; days: number }> => {
    const response = await api.delete(`/activity-logs/cleanup?days=${days}`);
    return response.data;
  },
};

// Alias for posts API (for compatibility with existing components)
export const blogApi = {
  ...postsApi,
  getAllIncludingDrafts: postsApi.getAllIncludingDrafts
};

// Export the api instance for use in other modules
export { api };