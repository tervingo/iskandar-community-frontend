import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';

const PostList: React.FC = () => {
  const { posts, loading, error, fetchPosts } = useBlogStore();

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <div className="loading">Loading posts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="post-list">
      <div className="header">
        <h1>Community Blog</h1>
        <Link to="/blog/create" className="btn btn-primary">
          Create New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">
          <p>No posts yet. Be the first to create one!</p>
          <Link to="/blog/create" className="btn btn-primary">
            Create Post
          </Link>
        </div>
      ) : (
        <div className="posts">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <h2>
                <Link to={`/blog/${post.id}`}>{post.title}</Link>
              </h2>
              <div className="post-meta">
                <span>By {post.author_name}</span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div className="post-excerpt">
                {post.content.length > 200 
                  ? `${post.content.substring(0, 200)}...` 
                  : post.content
                }
              </div>
              <Link to={`/blog/${post.id}`} className="read-more">
                Read More →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;