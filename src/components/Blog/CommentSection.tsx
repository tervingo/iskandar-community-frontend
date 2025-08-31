import React, { useEffect, useState } from 'react';
import { useBlogStore } from '../../stores/blogStore';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { comments, commentsLoading, error, fetchComments, createComment } = useBlogStore();
  
  const [commentForm, setCommentForm] = useState({
    author_name: '',
    content: '',
  });
  
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    fetchComments(postId);
  }, [postId]);

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
      setCommentForm({ author_name: '', content: '' });
      setShowCommentForm(false);
    }
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
          comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <strong>{comment.author_name}</strong>
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="comment-content">
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;