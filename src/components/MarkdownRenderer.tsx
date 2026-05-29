import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Sanitize the raw markdown/HTML content first
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'hr', 'br', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'className'],
    });
  }, [content]);

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown>{sanitizedContent}</ReactMarkdown>
    </div>
  );
};
