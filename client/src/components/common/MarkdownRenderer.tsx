import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Simple processing function
const processContent = (content: string): string => {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$') // Replace \[...\] with $$...$$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$'); // Replace \(...\) with $...$
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const processedContent = processContent(content);

  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="max-w-[60vw] md:max-w-full overflow-x-auto">
                <SyntaxHighlighter
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                  customStyle={{
                    margin: 0,
                    fontSize: 'inherit',
                  }}
                  codeTagProps={{
                    className: 'text-xs sm:text-sm md:text-base',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
