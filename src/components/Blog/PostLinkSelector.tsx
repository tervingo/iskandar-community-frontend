import React, { useState, useEffect, useCallback } from 'react';
import { postsApi, categoriesApi } from '../../services/api';
import { Post, Category } from '../../types';

interface PostLinkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (post: Post, linkText: string) => void;
}

const PostLinkSelector: React.FC<PostLinkSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPost
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [linkText, setLinkText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [includeUnpublished, setIncludeUnpublished] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      let fetchedPosts;
      try {
        // Try the new endpoint first
        fetchedPosts = await postsApi.getAllIncludingDrafts(
          selectedCategoryId || undefined, 
          includeUnpublished
        );
      } catch (error) {
        // Fallback to regular posts endpoint (published only)
        fetchedPosts = await postsApi.getAll(selectedCategoryId || undefined);
      }
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts for link selector:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, includeUnpublished]);

  const fetchCategories = useCallback(async () => {
    try {
      const fetchedCategories = await categoriesApi.getAll();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
      fetchCategories();
    }
  }, [isOpen, fetchPosts, fetchCategories]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectPost = (post: Post) => {
    const text = linkText.trim() || post.title;
    onSelectPost(post, text);
    setLinkText('');
    setSearchTerm('');
    onClose();
  };

  const getPostIcon = (post: Post) => {
    if (!post.is_published) return '📝';
    return '📄';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="post-link-selector-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="post-link-selector-modal" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="modal-header" style={{
          padding: '20px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>Select Post to Link</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div className="modal-filters" style={{
          padding: '15px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="linkText" style={{ fontSize: '14px', color: '#666' }}>
              Link Text:
            </label>
            <input
              id="linkText"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="e.g., este post"
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="categoryFilter" style={{ fontSize: '14px', color: '#666' }}>
              Category:
            </label>
            <select
              id="categoryFilter"
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="searchPosts" style={{ fontSize: '14px', color: '#666' }}>
              Search:
            </label>
            <input
              id="searchPosts"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar entradas..."
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '150px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              id="includeUnpublished"
              type="checkbox"
              checked={includeUnpublished}
              onChange={(e) => setIncludeUnpublished(e.target.checked)}
              style={{ margin: 0 }}
            />
            <label htmlFor="includeUnpublished" style={{ fontSize: '14px', color: '#666' }}>
              Include drafts
            </label>
          </div>
        </div>

        <div className="modal-body" style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No posts found
            </div>
          ) : (
            <div className="post-list" style={{
              display: 'grid',
              gap: '12px'
            }}>
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-item"
                  onClick={() => handleSelectPost(post)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: post.is_published ? '#fafafa' : '#fff9e6'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = post.is_published ? '#f0f0f0' : '#fff3cc';
                    e.currentTarget.style.borderColor = '#3498db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = post.is_published ? '#fafafa' : '#fff9e6';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  <div style={{
                    fontSize: '20px',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    {getPostIcon(post)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '4px',
                      color: '#333'
                    }}>
                      {post.title}
                      {!post.is_published && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#f39c12',
                          fontWeight: 'normal'
                        }}>
                          (Draft)
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <span>by {post.author_name}</span>
                      <span>•</span>
                      <span>{formatDate(post.created_at)}</span>
                      {post.category_name && (
                        <>
                          <span>•</span>
                          <span>{post.category_name}</span>
                        </>
                      )}
                    </div>
                    {post.content && (
                      <div style={{
                        fontSize: '12px',
                        color: '#888',
                        marginTop: '4px',
                        maxHeight: '40px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {post.content.replace(/[#*`]/g, '').substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    textAlign: 'right',
                    marginLeft: '12px'
                  }}>
                    {post.is_published ? 'Published' : 'Draft'}<br />
                    {formatDate(post.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{
          padding: '15px 20px',
          borderTop: '1px solid #ddd',
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <small style={{ color: '#666' }}>
            Click on a post to insert a link. Use the "Link Text" field to customize how the link appears in your content.
          </small>
        </div>
      </div>
    </div>
  );
};

export default PostLinkSelector;