import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import MarkdownHelp from './MarkdownHelp';
import FileLinkSelector from './FileLinkSelector';
import FileLink from './FileLinkRenderer';
import { FileItem } from '../../types';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { comments, commentsLoading, error, fetchComments, createComment, updateComment, deleteComment } = useBlogStore();
  const { user, isAdmin } = useAuthStore();
  
  const [commentForm, setCommentForm] = useState({
    author_name: user?.name || '',
    content: '',
  });
  
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showEditPreview, setShowEditPreview] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [showFileLinkSelector, setShowFileLinkSelector] = useState(false);
  const [showEditFileLinkSelector, setShowEditFileLinkSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments(postId);
  }, [postId]);

  useEffect(() => {
    if (user?.name && commentForm.author_name === '') {
      setCommentForm(prev => ({
        ...prev,
        author_name: user.name
      }));
    }
  }, [user?.name]);

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

    await createComment(postId, commentForm);
    
    if (!error) {
      setCommentForm({ author_name: user?.name || '', content: '' });
      setShowCommentForm(false);
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

  return (
    <div className="comment-section">
      <div className="comments-header">
        <h3>Comentarios ({comments.length})</h3>
        <button 
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="btn btn-primary"
        >
          {showCommentForm ? 'Cancelar' : 'Agregar Comentario'}
        </button>
      </div>

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
              </div>
              
              {!showPreview ? (
                <div>
                  <textarea
                    ref={textareaRef}
                    name="content"
                    value={commentForm.content}
                    onChange={handleCommentChange}
                    placeholder="Escribe tu comentario usando Markdown...&#10;&#10;Ejemplos:&#10;**negrita** *cursiva*&#10;[enlace](https://ejemplo.com)&#10;- Lista&#10;`código`&#10;{{file:id|texto}} para enlaces a archivos"
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
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Handle paragraphs and other text-containing elements
                        p: ({ children, ...props }) => {
                          const processChildren = (children: React.ReactNode): React.ReactNode => {
                            if (typeof children === 'string') {
                              // Split by file links but keep the text flow
                              const parts = children.split(/({{file:[^}]+}})/g);
                              return parts.map((part, index) => {
                                const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                                if (fileMatch) {
                                  const [, fileId, linkText] = fileMatch;
                                  return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                                }
                                return part;
                              });
                            }
                            
                            if (Array.isArray(children)) {
                              return children.map((child, index) => (
                                <React.Fragment key={index}>
                                  {processChildren(child)}
                                </React.Fragment>
                              ));
                            }
                            
                            return children;
                          };
                          
                          return <p {...props}>{processChildren(children)}</p>;
                        },
                        // Handle other elements that might contain text
                        span: ({ children, ...props }) => {
                          const processChildren = (children: React.ReactNode): React.ReactNode => {
                            if (typeof children === 'string') {
                              const parts = children.split(/({{file:[^}]+}})/g);
                              return parts.map((part, index) => {
                                const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                                if (fileMatch) {
                                  const [, fileId, linkText] = fileMatch;
                                  return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                                }
                                return part;
                              });
                            }
                            return children;
                          };
                          
                          return <span {...props}>{processChildren(children)}</span>;
                        },
                        // Handle regular links
                        a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        )
                      }}
                    >
                      {commentForm.content}
                    </ReactMarkdown>
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
              {commentsLoading ? 'Publicando...' : 'Publicar Comentario'}
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
          comments.map((comment) => {
            const canEditDelete = user && (isAdmin || comment.author_name === user.name);
            const isEditing = editingCommentId === comment.id;
            
            return (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <strong>{comment.author_name}</strong>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
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
                        </div>
                        
                        {!showEditPreview ? (
                          <textarea
                            ref={editTextareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="markdown-textarea"
                            disabled={commentsLoading}
                            placeholder="Edita tu comentario usando Markdown...&#10;Usa {{file:id|texto}} para enlaces a archivos"
                          />
                        ) : (
                          <div className="markdown-preview">
                            {editContent.trim() ? (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // Handle paragraphs and other text-containing elements
                                  p: ({ children, ...props }) => {
                                    const processChildren = (children: React.ReactNode): React.ReactNode => {
                                      if (typeof children === 'string') {
                                        // Split by file links but keep the text flow
                                        const parts = children.split(/({{file:[^}]+}})/g);
                                        return parts.map((part, index) => {
                                          const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                                          if (fileMatch) {
                                            const [, fileId, linkText] = fileMatch;
                                            return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                                          }
                                          return part;
                                        });
                                      }
                                      
                                      if (Array.isArray(children)) {
                                        return children.map((child, index) => (
                                          <React.Fragment key={index}>
                                            {processChildren(child)}
                                          </React.Fragment>
                                        ));
                                      }
                                      
                                      return children;
                                    };
                                    
                                    return <p {...props}>{processChildren(children)}</p>;
                                  },
                                  // Handle other elements that might contain text
                                  span: ({ children, ...props }) => {
                                    const processChildren = (children: React.ReactNode): React.ReactNode => {
                                      if (typeof children === 'string') {
                                        const parts = children.split(/({{file:[^}]+}})/g);
                                        return parts.map((part, index) => {
                                          const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                                          if (fileMatch) {
                                            const [, fileId, linkText] = fileMatch;
                                            return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                                          }
                                          return part;
                                        });
                                      }
                                      return children;
                                    };
                                    
                                    return <span {...props}>{processChildren(children)}</span>;
                                  },
                                  // Handle regular links
                                  a: ({node, ...props}) => (
                                    <a {...props} target="_blank" rel="noopener noreferrer" />
                                  )
                                }}
                              >
                                {editContent}
                              </ReactMarkdown>
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
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Handle paragraphs and other text-containing elements
                          p: ({ children, ...props }) => {
                            const processChildren = (children: React.ReactNode): React.ReactNode => {
                              if (typeof children === 'string') {
                                // Split by file links but keep the text flow
                                const parts = children.split(/({{file:[^}]+}})/g);
                                return parts.map((part, index) => {
                                  const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                                  if (fileMatch) {
                                    const [, fileId, linkText] = fileMatch;
                                    return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                                  }
                                  return part;
                                });
                              }
                              
                              if (Array.isArray(children)) {
                                return children.map((child, index) => (
                                  <React.Fragment key={index}>
                                    {processChildren(child)}
                                  </React.Fragment>
                                ));
                              }
                              
                              return children;
                            };
                            
                            return <p {...props}>{processChildren(children)}</p>;
                          },
                          // Handle other elements that might contain text
                          span: ({ children, ...props }) => {
                            const processChildren = (children: React.ReactNode): React.ReactNode => {
                              if (typeof children === 'string') {
                                const parts = children.split(/({{file:[^}]+}})/g);
                                return parts.map((part, index) => {
                                  const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                                  if (fileMatch) {
                                    const [, fileId, linkText] = fileMatch;
                                    return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                                  }
                                  return part;
                                });
                              }
                              return children;
                            };
                            
                            return <span {...props}>{processChildren(children)}</span>;
                          },
                          // Handle regular links
                          a: ({node, ...props}) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          )
                        }}
                      >
                        {comment.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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
      
      <FileLinkSelector
        isOpen={showEditFileLinkSelector}
        onClose={() => setShowEditFileLinkSelector(false)}
        onSelectFile={handleInsertEditFileLink}
      />
    </div>
  );
};

export default CommentSection;