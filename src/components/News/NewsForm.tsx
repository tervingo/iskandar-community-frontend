import React, { useState, useEffect } from 'react';
import { useNewsStore } from '../../stores/newsStore';
import { News } from '../../types';

interface NewsFormProps {
  news?: News | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const NewsForm: React.FC<NewsFormProps> = ({ news, onSuccess, onCancel }) => {
  const { createNews, updateNews, loading } = useNewsStore();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    comment: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isEditing = !!news;

  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title,
        url: news.url,
        comment: news.comment || ''
      });
    } else {
      setFormData({
        title: '',
        url: '',
        comment: ''
      });
    }
    setFormErrors({});
  }, [news]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    } else if (formData.title.length > 500) {
      errors.title = 'El título no puede tener más de 500 caracteres';
    }

    if (!formData.url.trim()) {
      errors.url = 'La URL es requerida';
    } else if (!formData.url.match(/^https?:\/\/.+/)) {
      errors.url = 'La URL debe comenzar con http:// o https://';
    } else if (formData.url.length > 2000) {
      errors.url = 'La URL no puede tener más de 2000 caracteres';
    }

    if (formData.comment && formData.comment.length > 1000) {
      errors.comment = 'El comentario no puede tener más de 1000 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && news) {
        await updateNews(news.id, {
          title: formData.title.trim(),
          url: formData.url.trim(),
          comment: formData.comment.trim() || undefined
        });
      } else {
        await createNews(
          formData.title.trim(),
          formData.url.trim(),
          formData.comment.trim() || undefined
        );
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="news-form-card">
      <div className="news-form-header">
        <h3>{isEditing ? '✏️ Editar Noticia' : '📰 Nueva Noticia'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="news-form">
        <div className="form-group">
          <label htmlFor="title">
            Título <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ej: Albania nombra a la primera ministra del mundo generada por inteligencia artificial..."
            className={formErrors.title ? 'error' : ''}
            maxLength={500}
            disabled={loading}
          />
          {formErrors.title && <div className="form-error">{formErrors.title}</div>}
          <div className="form-hint">
            {formData.title.length}/500 caracteres
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="url">
            URL <span className="required">*</span>
          </label>
          <input
            type="url"
            id="url"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://ejemplo.com/noticia"
            className={formErrors.url ? 'error' : ''}
            maxLength={2000}
            disabled={loading}
          />
          {formErrors.url && <div className="form-error">{formErrors.url}</div>}
          <div className="form-hint">
            URL completa del artículo o noticia
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comentario (opcional)</label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => handleChange('comment', e.target.value)}
            placeholder="Añade tu opinión o contexto sobre esta noticia..."
            rows={3}
            maxLength={1000}
            disabled={loading}
          />
          {formErrors.comment && <div className="form-error">{formErrors.comment}</div>}
          <div className="form-hint">
            {formData.comment.length}/1000 caracteres
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !formData.title.trim() || !formData.url.trim()}
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Publicar')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;