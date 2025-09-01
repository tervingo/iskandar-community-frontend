export interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface PostCreate {
  title: string;
  content: string;
  author_name: string;
}

export interface PostUpdate {
  title?: string;
  content?: string;
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