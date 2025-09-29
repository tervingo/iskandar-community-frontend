import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import { postsApi } from '../../services/api';
import CommentSection from './CommentSection';
import MarkdownProcessor from './MarkdownProcessor';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPost, loading, error, fetchPost, deletePost } = useBlogStore();
  const { user, isAdmin } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  // Handle scrolling to hash anchor after post loads
  useEffect(() => {
    if (currentPost && location.hash) {
      // Small delay to ensure the component has rendered
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [currentPost, location.hash]);

  const handleDelete = async () => {
    if (!id || !currentPost) return;
    
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setDeleting(true);
      try {
        await deletePost(id);
        navigate('/blog');
      } catch (error) {
        setDeleting(false);
      }
    }
  };

  const handlePublish = async (shouldPublish: boolean) => {
    if (!id || !currentPost) return;
    
    const action = shouldPublish ? 'publicar' : 'despublicar';
    if (window.confirm(`¿Estás seguro de que quieres ${action} este post?`)) {
      setPublishing(true);
      try {
        await postsApi.publish(id, { is_published: shouldPublish });
        // Refresh the post data to show updated status
        await fetchPost(id);
      } catch (error) {
        console.error(`Error ${action}ing post:`, error);
        alert(`Error al ${action} el post. Por favor intenta de nuevo.`);
      } finally {
        setPublishing(false);
      }
    }
  };

  // Check if current user can delete this post
  const canDelete = user && currentPost && (
    isAdmin || currentPost.author_name === user.name
  );

  // Check if current user can edit this post
  const canEdit = user && currentPost && (
    isAdmin || currentPost.author_name === user.name
  );

  // Check if current user can publish/unpublish this post
  const canPublish = user && currentPost && (
    isAdmin || currentPost.author_name === user.name
  );

  if (loading) return <div className="loading">Cargando post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!currentPost) return <div className="error">Post no encontrado</div>;

  return (
    <div className="post-detail">
      <div className="header">
        <div className="post-actions" style={{ display: 'flex', gap: '10px' }}>
          <Link to="/blog" className="btn btn-secondary">
            ← Volver al Blog
          </Link>
          
          {canEdit && (
            <Link
              to={`/blog/${id}/edit`}
              className="btn btn-primary"
            >
              Editar Post
            </Link>
          )}

          {canPublish && (
            <button
              onClick={() => handlePublish(!currentPost.is_published)}
              disabled={publishing}
              className={`btn ${currentPost.is_published ? 'btn-warning' : 'btn-success'}`}
              style={{
                backgroundColor: currentPost.is_published ? '#f39c12' : '#27ae60',
                borderColor: currentPost.is_published ? '#f39c12' : '#27ae60'
              }}
            >
              {publishing 
                ? (currentPost.is_published ? 'Despublicando...' : 'Publicando...') 
                : (currentPost.is_published ? 'Despublicar' : 'Publicar')
              }
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger"
            >
              {deleting ? 'Borrando...' : 'Borrar Post'}
            </button>
          )}
        </div>
      </div>

      <article className="post">
        <header className="post-header">
          <h1>
            {currentPost.title}
            {!currentPost.is_published && (
              <span style={{
                marginLeft: '10px',
                padding: '4px 12px',
                backgroundColor: '#f39c12',
                color: 'white',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                BORRADOR
              </span>
            )}
          </h1>
          <div className="post-meta">
            <span>Por {currentPost.author_name}</span>
            <span>•</span>
            {currentPost.is_published && currentPost.published_at ? (
              <span>Publicado {new Date(currentPost.published_at).toLocaleDateString()}</span>
            ) : (
              <span>Creado {new Date(currentPost.created_at).toLocaleDateString()}</span>
            )}
            {currentPost.updated_at !== currentPost.created_at && (
              <>
                <span>•</span>
                <span>Actualizado {new Date(currentPost.updated_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </header>

        <div className="post-content">
          <MarkdownProcessor content={currentPost.content} />
        </div>
      </article>

      <CommentSection postId={id!} />
    </div>
  );
};

export default PostDetail;