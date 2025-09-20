import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import { postsApi } from '../../services/api';
import CategorySidebar from './CategorySidebar';

const PostList: React.FC = () => {
  const { posts, loading, error, fetchPosts } = useBlogStore();
  const { isAdmin } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts(selectedCategoryId || undefined);
  }, [selectedCategoryId]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handlePinPriorityChange = async (postId: string, newPriority: number) => {
    try {
      await postsApi.updatePinPriority(postId, { pin_priority: newPriority });
      // Refresh the posts list to see the changes
      fetchPosts(selectedCategoryId || undefined);
    } catch (error) {
      console.error('Error updating pin priority:', error);
    }
  };

  const getPriorityLabel = (priority: number): string => {
    switch (priority) {
      case 3: return '🔴 Alta';
      case 2: return '🟡 Media';
      case 1: return '🟠 Baja';
      default: return '📝 Normal';
    }
  };

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 3: return '#e74c3c';
      case 2: return '#f39c12';
      case 1: return '#ff8c00';
      default: return '#95a5a6';
    }
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
                <span
                  className="post-priority-badge"
                  style={{
                    backgroundColor: getPriorityColor(post.pin_priority || 0),
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    marginRight: '8px'
                  }}
                >
                  {getPriorityLabel(post.pin_priority || 0)}
                </span>
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

              <div className="post-actions">
                <Link to={`/blog/${post.id}`} className="read-more">
                  Leer Más →
                </Link>

                {isAdmin && (
                  <div className="admin-controls">
                    <label style={{ fontSize: '12px', marginRight: '8px' }}>
                      Prioridad:
                    </label>
                    <select
                      value={post.pin_priority || 0}
                      onChange={(e) => handlePinPriorityChange(post.id, parseInt(e.target.value))}
                      style={{
                        fontSize: '12px',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        border: '1px solid #ccc'
                      }}
                    >
                      <option value={0}>📝 Normal</option>
                      <option value={1}>🟠 Baja</option>
                      <option value={2}>🟡 Media</option>
                      <option value={3}>🔴 Alta</option>
                    </select>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default PostList;