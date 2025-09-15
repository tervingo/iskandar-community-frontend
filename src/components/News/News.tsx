import React, { useEffect, useState } from 'react';
import { useNewsStore } from '../../stores/newsStore';
import { useAuthStore } from '../../stores/authStore';
import { News } from '../../types';
import { newsApi } from '../../services/api';
import NewsForm from './NewsForm';
import NewsItem from './NewsItem';

const NewsComponent: React.FC = () => {
  const { news, loading, error, fetchNews, deleteNews, clearError } = useNewsStore();
  const { user } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleDelete = async (newsItem: News) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar la noticia "${newsItem.title}"?`;
    if (window.confirm(confirmMessage)) {
      try {
        await deleteNews(newsItem.id);
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const canEditDelete = (newsItem: News): boolean => {
    if (!user) return false;
    return user.role === 'admin' || newsItem.created_by === user.name;
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingNews(null);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingNews(null);
  };

  const handleInitializeCollection = async () => {
    if (!user || user.role !== 'admin') return;

    setInitializing(true);
    try {
      const result = await newsApi.initialize();
      alert(`✅ ${result.message}`);
      // Refresh the news list after initialization
      await fetchNews();
    } catch (error: any) {
      console.error('Error initializing news collection:', error);
      const errorMessage = error.response?.data?.detail || 'Error al inicializar la colección de noticias';
      alert(`❌ ${errorMessage}`);
    } finally {
      setInitializing(false);
    }
  };

  if (loading && news.length === 0) {
    return (
      <div className="news-page">
        <div className="container">
          <div className="loading">Cargando noticias...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="container">
        <div className="news-header">
          <h1>📰 Noticias</h1>
          <p className="news-subtitle">
            Comparte y descubre noticias, artículos y enlaces interesantes
          </p>
          {user && (
            <div className="news-actions">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn btn-primary"
                disabled={loading}
              >
                {showCreateForm ? 'Cancelar' : '+ Agregar Noticia'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
            <button onClick={clearError} className="error-close">×</button>
            {user?.role === 'admin' && error.includes('404') && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p>La colección de noticias podría no estar inicializada.</p>
                <button
                  onClick={handleInitializeCollection}
                  className="btn btn-warning"
                  disabled={initializing}
                >
                  {initializing ? 'Inicializando...' : '🔧 Inicializar Colección'}
                </button>
              </div>
            )}
          </div>
        )}

        {(showCreateForm || editingNews) && (
          <div className="news-form-container">
            <NewsForm
              news={editingNews}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        <div className="news-list">
          {news.length === 0 ? (
            <div className="no-news">
              <p>📭 No hay noticias todavía.</p>
              <p>¡Sé el primero en compartir una noticia interesante!</p>
              {user?.role === 'admin' && (
                <div style={{ marginTop: '2rem' }}>
                  <p>Si acabas de crear la sección, puedes inicializar la colección:</p>
                  <button
                    onClick={handleInitializeCollection}
                    className="btn btn-secondary"
                    disabled={initializing}
                  >
                    {initializing ? 'Inicializando...' : '🔧 Inicializar con noticia de ejemplo'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="news-items">
              {news.map((newsItem) => (
                <NewsItem
                  key={newsItem.id}
                  news={newsItem}
                  canEdit={canEditDelete(newsItem)}
                  onEdit={() => setEditingNews(newsItem)}
                  onDelete={() => handleDelete(newsItem)}
                />
              ))}
            </div>
          )}
        </div>

        {loading && news.length > 0 && (
          <div className="loading-overlay">Actualizando...</div>
        )}
      </div>
    </div>
  );
};

export default NewsComponent;