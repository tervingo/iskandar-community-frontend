import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { postsApi } from '../../services/api';
import { Post } from '../../types';

const MyDrafts: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDrafts();
    }
  }, [isAuthenticated]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const draftsData = await postsApi.getMyDrafts();
      setDrafts(draftsData);
    } catch (err: any) {
      console.error('Error fetching drafts:', err);
      setError('Error al cargar los borradores');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres publicar este borrador?')) {
      return;
    }

    try {
      setPublishing(postId);
      await postsApi.publish(postId, { is_published: true });
      // Remove from drafts list since it's now published
      setDrafts(drafts.filter(draft => draft.id !== postId));
    } catch (err: any) {
      console.error('Error publishing draft:', err);
      alert('Error al publicar el borrador');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (postId: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el borrador "${title}"?`)) {
      return;
    }

    try {
      await postsApi.delete(postId);
      setDrafts(drafts.filter(draft => draft.id !== postId));
    } catch (err: any) {
      console.error('Error deleting draft:', err);
      alert('Error al eliminar el borrador');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <h2>Acceso denegado</h2>
        <p>Necesitas iniciar sesión para ver tus borradores.</p>
        <Link to="/blog" className="btn btn-primary">Ir al Blog</Link>
      </div>
    );
  }

  if (loading) return <div className="loading">Cargando borradores...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-drafts">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/blog" className="btn btn-secondary">
            ← Volver al Blog
          </Link>
          <h1 style={{ margin: 0 }}>Mis Borradores</h1>
        </div>
        <Link to="/blog/create" className="btn btn-primary">
          Crear Nuevo Post
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <h3>No tienes borradores</h3>
          <p>Los posts que guardes como borrador aparecerán aquí.</p>
          <Link to="/blog/create" className="btn btn-primary">
            Crear tu primer post
          </Link>
        </div>
      ) : (
        <div className="drafts-grid" style={{
          display: 'grid',
          gap: '20px',
          marginTop: '20px'
        }}>
          {drafts.map((draft) => (
            <div key={draft.id} className="draft-card" style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fefefe',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div className="draft-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 5px 0',
                    fontSize: '18px',
                    color: '#333'
                  }}>
                    <Link 
                      to={`/blog/${draft.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {draft.title}
                    </Link>
                  </h3>
                  <div className="draft-meta" style={{
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      backgroundColor: '#f39c12',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      BORRADOR
                    </span>
                    <span>Creado {new Date(draft.created_at).toLocaleDateString()}</span>
                    {draft.updated_at !== draft.created_at && (
                      <span>• Actualizado {new Date(draft.updated_at).toLocaleDateString()}</span>
                    )}
                    {draft.category_name && (
                      <span>• {draft.category_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="draft-content" style={{
                marginBottom: '15px'
              }}>
                <p style={{
                  margin: 0,
                  color: '#555',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {draft.content.length > 200 
                    ? `${draft.content.substring(0, 200)}...`
                    : draft.content
                  }
                </p>
              </div>

              <div className="draft-actions" style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '15px'
              }}>
                <Link 
                  to={`/blog/${draft.id}`}
                  className="btn btn-sm btn-outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    backgroundColor: 'transparent',
                    color: '#666'
                  }}
                >
                  Ver
                </Link>
                <Link 
                  to={`/blog/${draft.id}/edit`}
                  className="btn btn-sm"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: '1px solid #007bff'
                  }}
                >
                  Editar
                </Link>
                <button
                  onClick={() => handlePublish(draft.id)}
                  disabled={publishing === draft.id}
                  className="btn btn-sm btn-success"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: '1px solid #27ae60'
                  }}
                >
                  {publishing === draft.id ? 'Publicando...' : 'Publicar'}
                </button>
                <button
                  onClick={() => handleDelete(draft.id, draft.title)}
                  className="btn btn-sm btn-danger"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: '1px solid #e74c3c'
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDrafts;