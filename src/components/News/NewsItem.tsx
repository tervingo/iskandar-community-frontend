import React from 'react';
import { News } from '../../types';

interface NewsItemProps {
  news: News;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const NewsItem: React.FC<NewsItemProps> = ({ news, canEdit, onEdit, onDelete }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'hace 1 día';
    } else if (diffDays < 7) {
      return `hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return 'enlace';
    }
  };

  const getUrlIcon = (url: string): string => {
    const domain = getDomainFromUrl(url).toLowerCase();

    if (domain.includes('youtube') || domain.includes('youtu.be')) return '▶️';
    if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
    if (domain.includes('facebook')) return '👥';
    if (domain.includes('instagram')) return '📷';
    if (domain.includes('linkedin')) return '💼';
    if (domain.includes('github')) return '⚡';
    if (domain.includes('reddit')) return '🤖';
    if (domain.includes('medium')) return '📝';
    if (domain.includes('dev.to')) return '👨‍💻';
    if (domain.includes('stackoverflow')) return '❓';
    if (domain.includes('wikipedia')) return '📚';
    if (domain.includes('podcast') || domain.includes('spotify') || domain.includes('apple.com')) return '🎧';
    if (domain.includes('news') || domain.includes('noticias')) return '📰';
    if (domain.includes('blog')) return '📖';

    return '🔗';
  };

  return (
    <article className="news-item">
      <div className="news-content">
        <h2 className="news-title">{news.title}</h2>

        {news.comment && (
          <p className="news-comment">{news.comment}</p>
        )}

        <div className="news-link-section">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-link"
            title={`Abrir ${getDomainFromUrl(news.url)}`}
          >
            <span className="news-link-icon">{getUrlIcon(news.url)}</span>
            <span className="news-link-text">ver más...</span>
            <span className="news-link-domain">({getDomainFromUrl(news.url)})</span>
          </a>
        </div>

        <div className="news-meta">
          <div className="news-author">
            <span className="author-icon">👤</span>
            <span className="author-name">{news.created_by}</span>
          </div>

          <div className="news-date">
            <span className="date-icon">📅</span>
            <span className="date-text">{formatDate(news.created_at)}</span>
            {news.updated_at && news.updated_at !== news.created_at && (
              <span className="updated-indicator" title="Editado">✏️</span>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="news-actions">
          <button
            onClick={onEdit}
            className="btn btn-secondary btn-sm"
            title="Editar noticia"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="btn btn-danger btn-sm"
            title="Eliminar noticia"
          >
            🗑️
          </button>
        </div>
      )}
    </article>
  );
};

export default NewsItem;