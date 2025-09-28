export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  category_id?: string;
  category_name?: string;
  is_published: boolean;
  published_at?: string;
  pin_priority: number;
  created_at: string;
  updated_at: string;
}

export interface PostCreate {
  title: string;
  content: string;
  author_name: string;
  category_id?: string;
  is_published?: boolean;
  pin_priority?: number;
}

export interface PostUpdate {
  title?: string;
  content?: string;
  category_id?: string;
  is_published?: boolean;
  pin_priority?: number;
}

export interface PostPublish {
  is_published: boolean;
}

export interface PostPinPriority {
  pin_priority: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface CommentCreate {
  author_name: string;
  content: string;
}

export interface CommentUpdate {
  content: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
  message_type: string;
}

export interface ChatMessageCreate {
  username: string;
  message: string;
  message_type?: string;
}

export interface FileItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  cloudinary_url: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  source_type?: string;
  original_url?: string;
  video_id?: string;
  embed_url?: string;
  thumbnail_url?: string;
}

// Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'normal';
  created_at: string;
  updated_at: string;
  is_active: boolean;
  avatar?: string;
  phone?: string;
  last_seen?: string;
}

export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'normal';
  avatar?: string;
  phone?: string;
}

export interface TokenData {
  sub: string;
  role: string;
  exp: number;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

// News types
export interface News {
  id: string;
  title: string;
  url: string;
  comment?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface NewsCreate {
  title: string;
  url: string;
  comment?: string;
}

export interface NewsUpdate {
  title?: string;
  url?: string;
  comment?: string;
}

// User Activity Log types
export enum ActivityEventType {
  LOGIN = "login",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",
  POST_VIEW = "post_view",
  ADMIN_ACTION = "admin_action"
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  username: string;
  event_type: ActivityEventType;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  additional_info?: Record<string, any>;
}

export interface ActivityLogFilters {
  username?: string;
  event_type?: ActivityEventType;
  success?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityStats {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  events: Record<string, {
    successful: number;
    failed: number;
    total: number;
  }>;
  totals: {
    total_events: number;
    successful_events: number;
    failed_events: number;
  };
}