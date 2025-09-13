import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileLink from './FileLinkRenderer';
import PostLink from './PostLinkRenderer';

interface MarkdownProcessorProps {
  content: string;
}

const MarkdownProcessor: React.FC<MarkdownProcessorProps> = ({ content }) => {
  // Pre-process the content to replace file and post links with special markers
  const processContent = (content: string): string => {
    let processedContent = content;

    // Replace file links {{file:id|text}} with {{FILE_LINK:id:text}}
    processedContent = processedContent.replace(
      /\{\{file:([a-fA-F0-9]+)\|([^}]+)\}\}/g,
      '{{FILE_LINK:$1:$2}}'
    );

    // Also handle markdown-style file links [text](file:id) with {{FILE_LINK:id:text}}
    processedContent = processedContent.replace(
      /\[([^\]]+)\]\(file:([a-fA-F0-9]+)\)/g,
      '{{FILE_LINK:$2:$1}}'
    );

    // Replace post links {{post:id|text}} with {{POST_LINK:id:text}}
    processedContent = processedContent.replace(
      /\{\{post:([a-fA-F0-9]+)\|([^}]+)\}\}/g,
      '{{POST_LINK:$1:$2}}'
    );

    return processedContent;
  };

  const processedContent = processContent(content);

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children, ...props }) => {
          // Process paragraph content to handle file and post links
          const processChildren = (children: React.ReactNode): React.ReactNode => {
            if (typeof children === 'string') {
              // Split by link markers and process each part
              const parts = children.split(/({{(?:FILE_LINK|POST_LINK):[^}]+}})/);
              return parts.map((part, index) => {
                // Check for file links
                const fileMatch = part.match(/^{{FILE_LINK:([^:]+):(.+)}}$/);
                if (fileMatch) {
                  const [, fileId, linkText] = fileMatch;
                  return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                }
                
                // Check for post links
                const postMatch = part.match(/^{{POST_LINK:([^:]+):(.+)}}$/);
                if (postMatch) {
                  const [, postId, linkText] = postMatch;
                  return <PostLink key={index} postId={postId}>{linkText}</PostLink>;
                }
                
                return part;
              });
            }
            
            if (React.isValidElement(children)) {
              return React.cloneElement(children, {
                ...children.props,
                children: processChildren(children.props.children)
              });
            }
            
            if (Array.isArray(children)) {
              return children.map((child, index) => (
                <React.Fragment key={index}>{processChildren(child)}</React.Fragment>
              ));
            }
            
            return children;
          };

          return <p {...props}>{processChildren(children)}</p>;
        },
        a: ({ href, children, ...props }) => {
          // Regular links only - file and post links are handled in paragraph processing
          return (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          );
        }
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

export default MarkdownProcessor;