import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileLink from './FileLinkRenderer';

interface FileMarkdownProcessorProps {
  content: string;
}

const FileMarkdownProcessor: React.FC<FileMarkdownProcessorProps> = ({ content }) => {
  // Pre-process the content to replace file links with a special marker
  const processContent = (content: string): string => {
    // Match patterns like [text](file:id) and replace with a special format
    return content.replace(
      /\[([^\]]+)\]\(file:([a-fA-F0-9]+)\)/g,
      '{{FILE_LINK:$2:$1}}'
    );
  };

  const processedContent = processContent(content);

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children, ...props }) => {
          // Process paragraph content to handle file links
          const processChildren = (children: React.ReactNode): React.ReactNode => {
            if (typeof children === 'string') {
              // Split by file link markers and process each part
              const parts = children.split(/({{FILE_LINK:[^}]+}})/);
              return parts.map((part, index) => {
                const fileMatch = part.match(/^{{FILE_LINK:([^:]+):(.+)}}$/);
                if (fileMatch) {
                  const [, fileId, linkText] = fileMatch;
                  return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
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
          // Regular links only - file links are handled in paragraph processing
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

export default FileMarkdownProcessor;