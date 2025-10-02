import { create } from 'zustand';
import { Post, PostCreate, PostUpdate, Comment, CommentCreate, CommentUpdate } from '../types';
import { postsApi, commentsApi } from '../services/api';

interface BlogStore {
  posts: Post[];
  currentPost: Post | null;
  comments: Comment[];
  loading: boolean;
  commentsLoading: boolean;
  error: string | null;

  // Posts actions
  fetchPosts: (categoryId?: string, includeUnpublished?: boolean) => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  createPost: (post: PostCreate) => Promise<void>;
  updatePost: (id: string, post: PostUpdate) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  // Comments actions
  fetchComments: (postId: string) => Promise<void>;
  createComment: (postId: string, comment: CommentCreate) => Promise<void>;
  updateComment: (id: string, comment: CommentUpdate) => Promise<void>;
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
  commentsLoading: false,
  error: null,

  fetchPosts: async (categoryId?: string, includeUnpublished?: boolean) => {
    set({ loading: true, error: null });
    try {
      let posts;
      if (includeUnpublished) {
        posts = await postsApi.getAllIncludingDrafts(categoryId, includeUnpublished);
      } else {
        posts = await postsApi.getAll(categoryId);
      }
      set({ posts, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar las entradas', loading: false });
    }
  },

  fetchPost: async (id: string) => {
    set({ loading: true, error: null, currentPost: null });
    try {
      const post = await postsApi.getById(id);
      set({ currentPost: post, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Error al cargar la entrada';
      set({ error: errorMessage, loading: false, currentPost: null });
    }
  },

  createPost: async (postData: PostCreate) => {
    set({ loading: true, error: null });
    try {
      const newPost = await postsApi.create(postData);
      const { posts } = get();
      set({ posts: [newPost, ...posts], loading: false });
    } catch (error) {
      set({ error: 'Error al crear la entrada', loading: false });
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
      set({ error: 'Error al actualizar la entrada', loading: false });
    }
  },

  deletePost: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await postsApi.delete(id);
      const { posts, currentPost } = get();
      const updatedPosts = posts.filter(post => post.id !== id);
      // Clear current post if it's the one being deleted
      const newCurrentPost = currentPost?.id === id ? null : currentPost;
      set({ posts: updatedPosts, currentPost: newCurrentPost, loading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Error al eliminar la entrada';
      set({ error: errorMessage, loading: false });
      throw error; // Re-throw to allow component to handle the error
    }
  },

  fetchComments: async (postId: string) => {
    set({ commentsLoading: true, error: null });
    try {
      const comments = await commentsApi.getByPostId(postId);
      set({ comments, commentsLoading: false });
    } catch (error) {
      set({ error: 'Error al cargar los comentarios', commentsLoading: false });
    }
  },

  createComment: async (postId: string, commentData: CommentCreate) => {
    set({ commentsLoading: true, error: null });
    try {
      await commentsApi.create(postId, commentData);
      // Reload comments to get the proper hierarchical structure
      const comments = await commentsApi.getByPostId(postId);
      set({ comments, commentsLoading: false });
    } catch (error) {
      set({ error: 'Error al crear el comentario', commentsLoading: false });
    }
  },

  updateComment: async (id: string, commentData: CommentUpdate) => {
    set({ commentsLoading: true, error: null });
    try {
      const updatedComment = await commentsApi.update(id, commentData);
      const { comments } = get();
      const updatedComments = comments.map(comment => 
        comment.id === id ? updatedComment : comment
      );
      set({ comments: updatedComments, commentsLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Error al actualizar el comentario';
      set({ error: errorMessage, commentsLoading: false });
      throw error; // Re-throw to allow component to handle the error
    }
  },

  deleteComment: async (id: string) => {
    set({ commentsLoading: true, error: null });
    try {
      await commentsApi.delete(id);
      const { comments } = get();
      const updatedComments = comments.filter(comment => comment.id !== id);
      set({ comments: updatedComments, commentsLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Error al eliminar el comentario';
      set({ error: errorMessage, commentsLoading: false });
      throw error; // Re-throw to allow component to handle the error
    }
  },

  setError: (error: string | null) => set({ error }),
  clearCurrentPost: () => set({ currentPost: null, comments: [] }),
}));