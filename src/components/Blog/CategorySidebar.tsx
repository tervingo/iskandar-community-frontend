import React, { useEffect, useState } from 'react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useBlogStore } from '../../stores/blogStore';
import { Category } from '../../types';

interface CategorySidebarProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | null) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ selectedCategoryId, onCategorySelect }) => {
  const { categories, loading, error, fetchCategories } = useCategoryStore();
  const { posts } = useBlogStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  // Group posts by category
  const postsByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof posts> = {};
    
    // Add uncategorized posts
    const uncategorizedPosts = posts.filter(post => !post.category_id);
    if (uncategorizedPosts.length > 0) {
      grouped['uncategorized'] = uncategorizedPosts;
    }
    
    // Group by category
    posts.forEach(post => {
      if (post.category_id) {
        if (!grouped[post.category_id]) {
          grouped[post.category_id] = [];
        }
        grouped[post.category_id].push(post);
      }
    });
    
    return grouped;
  }, [posts]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryPosts = (categoryPosts: typeof posts, categoryId: string) => {
    const isExpanded = expandedCategories.has(categoryId);
    
    if (!isExpanded) return null;
    
    return (
      <ul className="category-posts">
        {categoryPosts.map(post => (
          <li key={post.id} className="category-post">
            <a href={`/blog/${post.id}`} className="post-link">
              {post.title}
            </a>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) return <div className="category-sidebar loading">Loading categories...</div>;
  if (error) return <div className="category-sidebar error">Error: {error}</div>;

  return (
    <div className="category-sidebar">
      <div className="sidebar-header">
        <h3>Categories</h3>
      </div>
      
      <div className="categories-list">
        {/* All Posts option */}
        <div 
          className={`category-item ${!selectedCategoryId ? 'active' : ''}`}
          onClick={() => onCategorySelect(null)}
        >
          <div className="category-header">
            <span className="category-name">All Posts</span>
            <span className="post-count">({posts.length})</span>
          </div>
        </div>

        {/* Uncategorized posts */}
        {postsByCategory['uncategorized'] && (
          <div className="category-item">
            <div 
              className="category-header clickable"
              onClick={() => toggleCategory('uncategorized')}
            >
              <span className="category-toggle">
                {expandedCategories.has('uncategorized') ? '▼' : '▶'}
              </span>
              <span className="category-name">Uncategorized</span>
              <span className="post-count">({postsByCategory['uncategorized'].length})</span>
            </div>
            {renderCategoryPosts(postsByCategory['uncategorized'], 'uncategorized')}
          </div>
        )}

        {/* Regular categories */}
        {categories.map(category => {
          const categoryPosts = postsByCategory[category.id] || [];
          const hasContent = categoryPosts.length > 0;
          
          if (!hasContent) return null;
          
          return (
            <div key={category.id} className="category-item">
              <div 
                className="category-header clickable"
                onClick={() => toggleCategory(category.id)}
              >
                <span className="category-toggle">
                  {expandedCategories.has(category.id) ? '▼' : '▶'}
                </span>
                <span 
                  className={`category-name ${selectedCategoryId === category.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCategorySelect(category.id);
                  }}
                >
                  {category.name}
                </span>
                <span className="post-count">({categoryPosts.length})</span>
              </div>
              {renderCategoryPosts(categoryPosts, category.id)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySidebar;