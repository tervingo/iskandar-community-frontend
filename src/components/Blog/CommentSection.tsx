import React, { useEffect, useState, useRef } from 'react';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import MarkdownHelp from './MarkdownHelp';
import FileLinkSelector from './FileLinkSelector';
import PostLinkSelector from './PostLinkSelector';
import MarkdownProcessor from './MarkdownProcessor';
import { FileItem, Post, Comment } from '../../types';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { comments, commentsLoading, error, fetchComments, createComment, updateComment, deleteComment } = useBlogStore();
  const { user, isAdmin } = useAuthStore();
  
  const [commentForm, setCommentForm] = useState({
    author_name: user?.name || '',
    content: '',
    parent_id: undefined as string | undefined,
    author_email: user?.email || '',
  });

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditPreview, setShowEditPreview] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [showFileLinkSelector, setShowFileLinkSelector] = useState(false);
  const [showPostLinkSelector, setShowPostLinkSelector] = useState(false);
  const [showEditFileLinkSelector, setShowEditFileLinkSelector] = useState(false);
  const [showEditPostLinkSelector, setShowEditPostLinkSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments(postId);
  }, [postId]);

  useEffect(() => {
    if (user?.name && commentForm.author_name === '') {
      setCommentForm(prev => ({
        ...prev,
        author_name: user.name,
        author_email: user.email || ''
      }));
    }
  }, [user?.name, user?.email]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCommentForm({
      ...commentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentForm.author_name.trim() || !commentForm.content.trim()) {
      return;
    }

    // Set parent_id if replying to a comment
    const commentData = {
      ...commentForm,
      parent_id: replyingToId || undefined
    };

    await createComment(postId, commentData);

    if (!error) {
      setCommentForm({
        author_name: user?.name || '',
        content: '',
        parent_id: undefined,
        author_email: user?.email || ''
      });
      setShowCommentForm(false);
      setReplyingToId(null);
    }
  };

  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      await updateComment(commentId, { content: editContent });
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        // Error is already handled in the store
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
    setShowEditPreview(false);
  };

  const handleReplyToComment = (commentId: string) => {
    setReplyingToId(commentId);
    setShowCommentForm(true);
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setShowCommentForm(false);
    setCommentForm({
      author_name: user?.name || '',
      content: '',
      parent_id: undefined,
      author_email: user?.email || ''
    });
  };

  const handleInsertFileLink = (file: FileItem, linkText: string) => {
    const fileLink = `{{file:${file.id}|${linkText}}}`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = commentForm.content;
      
      const newContent = 
        currentContent.substring(0, start) +
        fileLink +
        currentContent.substring(end);
      
      setCommentForm({
        ...commentForm,
        content: newContent
      });
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newCursorPosition = start + fileLink.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const handleInsertEditFileLink = (file: FileItem, linkText: string) => {
    const fileLink = `{{file:${file.id}|${linkText}}}`;
    const textarea = editTextareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = editContent;
      
      const newContent = 
        currentContent.substring(0, start) +
        fileLink +
        currentContent.substring(end);
      
      setEditContent(newContent);
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newCursorPosition = start + fileLink.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const handleInsertPostLink = (post: Post, linkText: string) => {
    const postLink = `{{post:${post.id}|${linkText}}}`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = commentForm.content;
      
      const newContent = 
        currentContent.substring(0, start) +
        postLink +
        currentContent.substring(end);
      
      setCommentForm({
        ...commentForm,
        content: newContent
      });
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newCursorPosition = start + postLink.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const handleInsertEditPostLink = (post: Post, linkText: string) => {
    const postLink = `{{post:${post.id}|${linkText}}}`;
    const textarea = editTextareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = editContent;
      
      const newContent = 
        currentContent.substring(0, start) +
        postLink +
        currentContent.substring(end);
      
      setEditContent(newContent);
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newCursorPosition = start + postLink.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const canEditDelete = user && (isAdmin || comment.author_name === user.name);
    const isEditing = editingCommentId === comment.id;
    const maxDepth = 3; // Limit nesting depth to avoid UI issues

    return (
      <div key={comment.id} className={`comment ${depth > 0 ? 'comment-reply' : ''}`} style={{
        marginLeft: depth > 0 ? `${Math.min(depth, maxDepth) * 20}px` : '0',
        borderLeft: depth > 0 ? '2px solid #e0e0e0' : 'none',
        paddingLeft: depth > 0 ? '15px' : '0'
      }}>
        <div className="comment-header">
          <strong>{comment.author_name}</strong>
          <span className="comment-date">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
          {depth > 0 && <span className="reply-indicator">↳</span>}
          {canEditDelete && (
            <div className="comment-actions">
              {!isEditing && (
                <>
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="btn btn-sm btn-secondary"
                    disabled={commentsLoading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="btn btn-sm btn-danger"
                    disabled={commentsLoading}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="comment-content">
          {isEditing ? (
            <div className="comment-edit-form">
              <div className="markdown-editor">
                <div className="editor-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${!showEditPreview ? 'active' : ''}`}
                    onClick={() => setShowEditPreview(false)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${showEditPreview ? 'active' : ''}`}
                    onClick={() => setShowEditPreview(true)}
                  >
                    👁️ Vista previa
                  </button>
                  <button
                    type="button"
                    className="help-btn"
                    onClick={() => setShowMarkdownHelp(true)}
                    title="Ayuda de Markdown"
                  >
                    ❓ Ayuda
                  </button>
                  <button
                    type="button"
                    className="file-link-btn"
                    onClick={() => setShowEditFileLinkSelector(true)}
                    title="Enlazar archivo del repositorio"
                  >
                    📎 Enlazar archivo
                  </button>
                  <button
                    type="button"
                    className="post-link-btn"
                    onClick={() => setShowEditPostLinkSelector(true)}
                    title="Enlazar post del blog"
                    style={{
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      border: '1px solid #9b59b6'
                    }}
                  >
                    📄 Link Post
                  </button>
                </div>

                {!showEditPreview ? (
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="markdown-textarea"
                    disabled={commentsLoading}
                    placeholder="Edita tu comentario usando Markdown...&#10;Usa botones 📎 y 📄 para enlaces"
                  />
                ) : (
                  <div className="markdown-preview">
                    {editContent.trim() ? (
                      <MarkdownProcessor content={editContent} />
                    ) : (
                      <p className="preview-empty">Nada que mostrar en vista previa</p>
                    )}
                  </div>
                )}
              </div>
              <div className="comment-edit-actions">
                <button
                  onClick={() => handleUpdateComment(comment.id)}
                  className="btn btn-sm btn-primary"
                  disabled={commentsLoading || !editContent.trim()}
                >
                  {commentsLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-sm btn-secondary"
                  disabled={commentsLoading}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-markdown">
              <MarkdownProcessor content={comment.content} />
            </div>
          )}
        </div>

        {/* Reply button */}
        {!isEditing && depth < maxDepth && (
          <div className="comment-reply-actions">
            <button
              onClick={() => handleReplyToComment(comment.id)}
              className="btn btn-sm btn-outline-primary reply-btn"
              disabled={commentsLoading}
            >
              💬 Responder
            </button>
          </div>
        )}

        {/* Render nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="comments" className="comment-section">
      <div className="comments-header">
        <h3>Comentarios ({comments.length})</h3>
        <button
          onClick={() => {
            if (replyingToId) {
              handleCancelReply();
            } else {
              setShowCommentForm(!showCommentForm);
            }
          }}
          className="btn btn-primary"
        >
          {showCommentForm ? 'Cancelar' : 'Agregar Comentario'}
        </button>
      </div>

      {replyingToId && (
        <div className="reply-indicator-header">
          <p>
            💬 Respondiendo a un comentario.{' '}
            <button
              onClick={handleCancelReply}
              className="btn btn-sm btn-secondary"
            >
              Cancelar respuesta
            </button>
          </p>
        </div>
      )}

      {showCommentForm && (
        <form onSubmit={handleCommentSubmit} className="comment-form">
          {error && <div className="error">Error: {error}</div>}
          
          <div className="form-group">
            <input
              type="text"
              name="author_name"
              value={commentForm.author_name}
              onChange={handleCommentChange}
              placeholder="Tu nombre"
              required
            />
          </div>
          
          <div className="form-group">
            <div className="markdown-editor">
              <div className="editor-tabs">
                <button
                  type="button"
                  className={`tab-btn ${!showPreview ? 'active' : ''}`}
                  onClick={() => setShowPreview(false)}
                >
                  ✏️ Escribir
                </button>
                <button
                  type="button"
                  className={`tab-btn ${showPreview ? 'active' : ''}`}
                  onClick={() => setShowPreview(true)}
                >
                  👁️ Vista previa
                </button>
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => setShowMarkdownHelp(true)}
                  title="Ayuda de Markdown"
                >
                  ❓ Ayuda
                </button>
                <button
                  type="button"
                  className="file-link-btn"
                  onClick={() => setShowFileLinkSelector(true)}
                  title="Enlazar archivo del repositorio"
                >
                  📎 Enlazar archivo
                </button>
                <button
                  type="button"
                  className="post-link-btn"
                  onClick={() => setShowPostLinkSelector(true)}
                  title="Enlazar post del blog"
                  style={{
                    backgroundColor: '#9b59b6',
                    color: 'white',
                    border: '1px solid #9b59b6'
                  }}
                >
                  📄 Link Post
                </button>
              </div>
              
              {!showPreview ? (
                <div>
                  <textarea
                    ref={textareaRef}
                    name="content"
                    value={commentForm.content}
                    onChange={handleCommentChange}
                    placeholder={replyingToId
                      ? "Escribe tu respuesta usando Markdown...&#10;&#10;Ejemplos:&#10;**negrita** *cursiva*&#10;[enlace](https://ejemplo.com)&#10;- Lista&#10;`código`&#10;&#10;Usa botones 📎 y 📄 para enlaces a archivos y posts"
                      : "Escribe tu comentario usando Markdown...&#10;&#10;Ejemplos:&#10;**negrita** *cursiva*&#10;[enlace](https://ejemplo.com)&#10;- Lista&#10;`código`&#10;&#10;Usa botones 📎 y 📄 para enlaces a archivos y posts"
                    }
                    rows={4}
                    required
                    className="markdown-textarea"
                  />
                  <div className="markdown-help">
                    <small>
                      Soporta <strong>Markdown</strong>: **negrita**, *cursiva*, [enlaces](url), `código`, listas y más
                    </small>
                  </div>
                </div>
              ) : (
                <div className="markdown-preview">
                  {commentForm.content.trim() ? (
                    <MarkdownProcessor content={commentForm.content} />
                  ) : (
                    <p className="preview-empty">Nada que mostrar en vista previa</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setShowCommentForm(false)}
              className="btn btn-secondary"
              disabled={commentsLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={commentsLoading || !commentForm.author_name.trim() || !commentForm.content.trim()}
            >
              {commentsLoading
                ? (replyingToId ? 'Publicando respuesta...' : 'Publicando...')
                : (replyingToId ? 'Publicar Respuesta' : 'Publicar Comentario')
              }
            </button>
          </div>
        </form>
      )}

      <div className="comments">
        {commentsLoading && <div className="loading">Cargando comentarios...</div>}
        
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No hay comentarios todavía. Sé el primero en comentar!</p>
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
      
      <MarkdownHelp
        isOpen={showMarkdownHelp}
        onClose={() => setShowMarkdownHelp(false)}
      />
      
      <FileLinkSelector
        isOpen={showFileLinkSelector}
        onClose={() => setShowFileLinkSelector(false)}
        onSelectFile={handleInsertFileLink}
      />
      
      <PostLinkSelector
        isOpen={showPostLinkSelector}
        onClose={() => setShowPostLinkSelector(false)}
        onSelectPost={handleInsertPostLink}
      />
      
      <FileLinkSelector
        isOpen={showEditFileLinkSelector}
        onClose={() => setShowEditFileLinkSelector(false)}
        onSelectFile={handleInsertEditFileLink}
      />

      <PostLinkSelector
        isOpen={showEditPostLinkSelector}
        onClose={() => setShowEditPostLinkSelector(false)}
        onSelectPost={handleInsertEditPostLink}
      />
    </div>
  );
};

export default CommentSection;