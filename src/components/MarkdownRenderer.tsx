import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { PluggableList } from 'unified';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const remarkPlugins: PluggableList = [remarkGfm];
const strictSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'input',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': ['className', 'style'],
    a: ['href', 'title', 'target', 'rel'],
    input: ['type', 'checked', 'disabled'],
    th: ['align', 'colSpan', 'rowSpan'],
    td: ['align', 'colSpan', 'rowSpan'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
  },
};

const rehypePlugins: PluggableList = [[rehypeSanitize, strictSchema]];

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => (
  <div className={`prose prose-invert max-w-none overflow-x-auto ${className}`}>
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default MarkdownRenderer;