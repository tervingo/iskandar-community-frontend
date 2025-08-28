import { create } from 'zustand';
import { Post, PostCreate, PostUpdate, Comment, CommentCreate } from '../types';
import { postsApi, commentsApi } from '../services/api';

interface BlogStore {
  posts: Post[];
  currentPost: Post | null;
  comments: Comment[];
  loading: boolean;
  error: string | null;

  // Posts actions
  fetchPosts: () => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  createPost: (post: PostCreate) => Promise<void>;
  updatePost: (id: string, post: PostUpdate) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  // Comments actions
  fetchComments: (postId: string) => Promise<void>;
  createComment: (postId: string, comment: CommentCreate) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;

  // Utility actions
  setError: (error: string | null) => void;
  clearCurrentPost: () => void;
}

export const useBlogStore = create<BlogStore>((set, get) => ({
  posts: [],
  currentPost: null,
  comments: [],
  loading: false,
  error: null,

  fetchPosts: async () => {
    set({ loading: true, error: null });
    try {
      const posts = await postsApi.getAll();
      set({ posts, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch posts', loading: false });
    }
  },

  fetchPost: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const post = await postsApi.getById(id);
      set({ currentPost: post, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch post', loading: false });
    }
  },

  createPost: async (postData: PostCreate) => {
    set({ loading: true, error: null });
    try {
      const newPost = await postsApi.create(postData);
      const { posts } = get();
      set({ posts: [newPost, ...posts], loading: false });
    } catch (error) {
      set({ error: 'Failed to create post', loading: false });
    }
  },

  updatePost: async (id: string, postData: PostUpdate) => {
    set({ loading: true, error: null });
    try {
      const updatedPost = await postsApi.update(id, postData);
      const { posts } = get();
      const updatedPosts = posts.map(post => 
        post.id === id ? updatedPost : post
      );
      set({ posts: updatedPosts, currentPost: updatedPost, loading: false });
    } catch (error) {
      set({ error: 'Failed to update post', loading: false });
    }
  },

  deletePost: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await postsApi.delete(id);
      const { posts } = get();
      const updatedPosts = posts.filter(post => post.id !== id);
      set({ posts: updatedPosts, loading: false });
    } catch (error) {
      set({ error: 'Failed to delete post', loading: false });
    }
  },

  fetchComments: async (postId: string) => {
    set({ loading: true, error: null });
    try {
      const comments = await commentsApi.getByPostId(postId);
      set({ comments, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch comments', loading: false });
    }
  },

  createComment: async (postId: string, commentData: CommentCreate) => {
    set({ loading: true, error: null });
    try {
      const newComment = await commentsApi.create(postId, commentData);
      const { comments } = get();
      set({ comments: [...comments, newComment], loading: false });
    } catch (error) {
      set({ error: 'Failed to create comment', loading: false });
    }
  },

  deleteComment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await commentsApi.delete(id);
      const { comments } = get();
      const updatedComments = comments.filter(comment => comment.id !== id);
      set({ comments: updatedComments, loading: false });
    } catch (error) {
      set({ error: 'Failed to delete comment', loading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
  clearCurrentPost: () => set({ currentPost: null, comments: [] }),
}));