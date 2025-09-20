import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import CategorySidebar from './CategorySidebar';

const PostList: React.FC = () => {
  const { posts, loading, error, fetchPosts } = useBlogStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts(selectedCategoryId || undefined);
  }, [selectedCategoryId]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  if (loading) return <div className="loading">Cargando posts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="blog-layout">
      <CategorySidebar 
        selectedCategoryId={selectedCategoryId || undefined}
        onCategorySelect={handleCategorySelect}
      />
      <div className="post-list">
      <div className="header">
        <h1>Blog</h1>
        <div className="header-actions">
          <Link to="/blog/drafts" className="btn btn-secondary">
            Mis Borradores
          </Link>
          <Link to="/blog/create" className="btn btn-primary">
            Crear Nuevo Post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">
          <p>No hay posts todavía. Sé el primero en crear uno!</p>
          <Link to="/blog/create" className="btn btn-primary">
            Crear Post
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
                {post.category_name && (
                  <>
                    <span className="post-category">{post.category_name}</span>
                    <span>•</span>
                  </>
                )}
                <span>Por {post.author_name}</span>
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
                Leer Más →
              </Link>
            </article>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default PostList;