import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import { blogApi } from '../../services/api';

interface PostLinkProps {
  postId: string;
  children: React.ReactNode;
}

const PostLink: React.FC<PostLinkProps> = ({ postId, children }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postData = await blogApi.getById(postId);
        setPost(postData);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Post not found');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const getPostUrl = () => {
    if (!post) return '#';
    return `/blog/posts/${post.id}`;
  };

  if (loading) {
    return (
      <span className="post-link loading" style={{ 
        color: '#666', 
        fontStyle: 'italic',
        cursor: 'default'
      }}>
        {children} (loading...)
      </span>
    );
  }

  if (error || !post) {
    return (
      <span className="post-link error" style={{ 
        color: '#e74c3c', 
        textDecoration: 'line-through',
        cursor: 'default'
      }}>
        {children} (post not found)
      </span>
    );
  }

  const getPostIcon = (post: Post) => {
    // Check if post is draft or published
    if (!post.is_published) return '📝';
    return '📄';
  };

  return (
    <a
      href={getPostUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="post-link"
      title={`${post.title} by ${post.author_name}`}
      style={{
        color: '#3498db',
        borderBottom: '1px dotted #3498db',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <span style={{ fontSize: '0.9em' }}>{getPostIcon(post)}</span>
      {children}
    </a>
  );
};

export default PostLink;