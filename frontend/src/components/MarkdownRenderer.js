import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Maximize2, Minimize2 } from 'lucide-react';

const CustomTable = ({ children }) => (
  <div className="overflow-x-auto max-w-full">
    <table className="min-w-full bg-white border border-gray-300">
      {children}
    </table>
  </div>
);

const CustomTableCell = ({ children, isHeader }) => {
  const content = React.Children.map(children, child => {
    if (typeof child === 'string' && child.startsWith('https://')) {
      return <a href={child} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">[Link]</a>;
    }
    return child;
  });

  const Tag = isHeader ? 'th' : 'td';
  const baseClasses = "px-4 py-2 text-sm border-t";
  const headerClasses = isHeader ? "font-semibold text-gray-600 uppercase tracking-wider bg-gray-100" : "text-gray-500";

  return (
    <Tag className={`${baseClasses} ${headerClasses}`}>
      {content}
    </Tag>
  );
};

const MarkdownRenderer = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`prose max-w-none ${isExpanded ? 'fixed inset-0 z-50 bg-white overflow-auto p-8' : 'relative'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
        aria-label={isExpanded ? "Minimize" : "Maximize"}
      >
        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
      <ReactMarkdown 
        children={content}
        remarkPlugins={[remarkGfm]}
        components={{
          table: CustomTable,
          thead: ({ children }) => <thead>{children}</thead>,
          th: ({ children }) => <CustomTableCell isHeader={true}>{children}</CustomTableCell>,
          td: ({ children }) => <CustomTableCell isHeader={false}>{children}</CustomTableCell>,
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
        }}
      />
    </div>
  );
};

export default MarkdownRenderer;