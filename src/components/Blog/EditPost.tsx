import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import FileLinkSelector from './FileLinkSelector';
import PostLinkSelector from './PostLinkSelector';
import MarkdownProcessor from './MarkdownProcessor';
import { FileItem, Post } from '../../types';

const EditPost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentPost, loading, error, fetchPost, updatePost } = useBlogStore();
  const { user, isAdmin } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
    fetchCategories();
  }, [id]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
  });

  const [updating, setUpdating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFileLinkSelector, setShowFileLinkSelector] = useState(false);
  const [showPostLinkSelector, setShowPostLinkSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update form data when currentPost is loaded
  useEffect(() => {
    if (currentPost) {
      setFormData({
        title: currentPost.title,
        content: currentPost.content,
        category_id: currentPost.category_id || '',
      });
    }
  }, [currentPost]);

  // Check if current user can edit this post
  const canEdit = user && currentPost && (
    isAdmin || currentPost.author_name === user.name
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (publishStatus?: boolean) => {
    if (!formData.title.trim() || !formData.content.trim() || !id || !canEdit) {
      return;
    }

    setUpdating(true);
    
    try {
      const updateData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id || undefined,
        ...(publishStatus !== undefined && { is_published: publishStatus })
      };
      
      await updatePost(id, updateData);
      
      if (!error) {
        navigate(`/blog/${id}`);
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form submit doesn't specify publish status, so keep current status
    handleSubmit();
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

  if (loading) return <div className="loading">Cargando post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!currentPost) return <div className="error">Post no encontrado</div>;
  if (!canEdit) return <div className="error">No tienes permiso para editar este post</div>;

  return (
    <div className="edit-post">
      <div className="header">
        <h1>Editar Post</h1>
        <Link 
          to={`/blog/${id}`}
          className="btn btn-secondary"
        >
          ← Volver al Post
        </Link>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <form onSubmit={handleFormSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="author_name">Autor</label>
          <input
            type="text"
            id="author_name"
            value={currentPost.author_name}
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
                📎 Enlazar archivo
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
                  # Headers, - Lists, [links](url), ```code blocks```<br/>
                  <strong>Enlaces de archivos:</strong> Usa el botón "📎 Enlace de archivo" para insertar enlaces de archivos<br/>
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
          <Link
            to={`/blog/${id}`}
            className="btn btn-secondary"
          >
            Cancelar
          </Link>
          <button 
            type="button"
            onClick={() => handleSubmit()}
            className="btn btn-outline"
            disabled={updating || !formData.title.trim() || !formData.content.trim()}
            style={{
              backgroundColor: 'aqua',
              border: '1px solid #6c757d',
              color: 'black'
            }}
          >
            {updating ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {currentPost && !currentPost.is_published && (
            <button 
              type="button"
              onClick={() => handleSubmit(true)}
              className="btn btn-success"
              disabled={updating || !formData.title.trim() || !formData.content.trim()}
              style={{
                backgroundColor: 'chartreuse',
                borderColor: 'chartreuse',
                color: 'black'
              }}
            >
              {updating ? 'Publicando...' : 'Guardar y Publicar'}
            </button>
          )}
          {currentPost && currentPost.is_published && (
            <button 
              type="button"
              onClick={() => handleSubmit(false)}
              className="btn btn-warning"
              disabled={updating || !formData.title.trim() || !formData.content.trim()}
              style={{
                backgroundColor: '#f39c12',
                borderColor: '#f39c12'
              }}
            >
              {updating ? 'Despublicando...' : 'Guardar como Borrador'}
            </button>
          )}
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

export default EditPost;