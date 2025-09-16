import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import FileLinkSelector from './FileLinkSelector';
import PostLinkSelector from './PostLinkSelector';
import MarkdownProcessor from './MarkdownProcessor';
import { FileItem, Post } from '../../types';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost, loading, error } = useBlogStore();
  const { user } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: user?.name || '',
    category_id: '',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showFileLinkSelector, setShowFileLinkSelector] = useState(false);
  const [showPostLinkSelector, setShowPostLinkSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (isPublished: boolean) => {
    if (!formData.title.trim() || !formData.content.trim() || !user?.name) {
      return;
    }

    const postData = {
      title: formData.title,
      content: formData.content,
      author_name: user.name,
      category_id: formData.category_id || undefined,
      is_published: isPublished
    };
    
    await createPost(postData);
    
    if (!error) {
      if (isPublished) {
        navigate('/blog');
      } else {
        // Navigate to drafts or show success message
        navigate('/blog/drafts');
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form submit doesn't specify publish status, so default to false (draft)
    handleSubmit(false);
  };

  const handleInsertFileLink = (file: FileItem, linkText: string) => {
    const fileLink = `{{file:${file.id}|${linkText}}}`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      
      const newContent = 
        currentContent.substring(0, start) +
        fileLink +
        currentContent.substring(end);
      
      setFormData({
        ...formData,
        content: newContent
      });
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + fileLink.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const handleInsertPostLink = (post: Post, linkText: string) => {
    const postLink = `{{post:${post.id}|${linkText}}}`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      
      const newContent = 
        currentContent.substring(0, start) +
        postLink +
        currentContent.substring(end);
      
      setFormData({
        ...formData,
        content: newContent
      });
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + postLink.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  return (
    <div className="create-post">
      <div className="header">
        <h1>Crear Nuevo Post</h1>
        <button 
          type="button" 
          onClick={() => navigate('/blog')}
          className="btn btn-secondary"
        >
          ← Volver al Blog
        </button>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <form onSubmit={handleFormSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="author_name">Autor</label>
          <input
            type="text"
            id="author_name"
            name="author_name"
            value={user?.name || ''}
            placeholder="Nombre del Autor"
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="category_id">Categoría (Opcional)</label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
          >
            <option value="">-- Sin Categoría --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">Título del Post</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Introduce el título del post"
            required
          />
        </div>

        <div className="form-group">
          <div className="content-header">
            <label htmlFor="content">Contenido</label>
            <div className="content-tabs">
              <button
                type="button"
                className={`tab-btn ${!showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(false)}
              >
                Escribir
              </button>
              <button
                type="button"
                className={`tab-btn ${showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(true)}
              >
                Previsualizar
              </button>
              <button
                type="button"
                className="tab-btn file-link-btn"
                onClick={() => setShowFileLinkSelector(true)}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: '1px solid #3498db'
                }}
              >
                📎 Link File
              </button>
              <button
                type="button"
                className="tab-btn post-link-btn"
                onClick={() => setShowPostLinkSelector(true)}
                style={{
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: '1px solid #9b59b6'
                }}
              >
                📄 Link Post
              </button>
            </div>
          </div>
          
          {!showPreview ? (
            <>
              <textarea
                ref={textareaRef}
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Escribe tu contenido del post usando formato Markdown..."
                rows={12}
                required
              />
              <div className="markdown-help">
                <small>
                  <strong>Markdown soportado:</strong> **bold**, *italic*, `code`, 
                  # Cabeceras, - Listas, [links](url), ```bloques de código```<br/>
                  <strong>Enlaces de archivos:</strong> Usa el botón "📎 Link File" para insertar enlaces de archivos<br/>
                  <strong>Enlaces de posts:</strong> Usa el botón "📄 Link Post" para insertar enlaces a otros posts
                </small>
              </div>
            </>
          ) : (
            <div className="preview-content">
              <MarkdownProcessor content={formData.content || '*No hay contenido para previsualizar*'} />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/blog')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={() => handleSubmit(false)}
            className="btn btn-outline"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            style={{
              backgroundColor: 'chartreuse',
              border: '1px solid #6c757d',
              color: 'black'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Borrador'}
          </button>
          <button 
            type="button"
            onClick={() => handleSubmit(true)}
            className="btn btn-primary"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            style={{
              backgroundColor: 'aqua',
              borderColor: 'aqua',
              color: 'black'
            }}
          >
            {loading ? 'Publicando...' : 'Publicar Post'}
          </button>
        </div>
      </form>

      {/* File Link Selector Modal */}
      <FileLinkSelector
        isOpen={showFileLinkSelector}
        onClose={() => setShowFileLinkSelector(false)}
        onSelectFile={handleInsertFileLink}
      />

      {/* Post Link Selector Modal */}
      <PostLinkSelector
        isOpen={showPostLinkSelector}
        onClose={() => setShowPostLinkSelector(false)}
        onSelectPost={handleInsertPostLink}
      />
    </div>
  );
};

export default CreatePost;