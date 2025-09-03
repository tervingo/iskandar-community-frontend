import React, { useEffect, useState } from 'react';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';

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
  };

  return (
    <div className="comment-section">
      <div className="comments-header">
        <h3>Comments ({comments.length})</h3>
        <button 
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="btn btn-primary"
        >
          {showCommentForm ? 'Cancel' : 'Add Comment'}
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
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="form-group">
            <textarea
              name="content"
              value={commentForm.content}
              onChange={handleCommentChange}
              placeholder="Write your comment..."
              rows={4}
              required
            />
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
              {commentsLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      <div className="comments">
        {commentsLoading && <div className="loading">Loading comments...</div>}
        
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
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
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="comment-edit-textarea"
                        disabled={commentsLoading}
                      />
                      <div className="comment-edit-actions">
                        <button 
                          onClick={() => handleUpdateComment(comment.id)}
                          className="btn btn-sm btn-primary"
                          disabled={commentsLoading || !editContent.trim()}
                        >
                          {commentsLoading ? 'Updating...' : 'Update'}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="btn btn-sm btn-secondary"
                          disabled={commentsLoading}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    comment.content
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;