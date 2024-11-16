// src/components/Chat/ChatContainer.js
import React from 'react';
import ChatMessage from '../ChatMessage';
import DocumentList from '../DocumentList';
import MarkdownRenderer from '../MarkdownRenderer';

const LoadingSpinner = ({ message }) => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2">{message}</span>
  </div>
);

const ChatContainer = ({ 
  chatHistory, 
  isGeneratingSample, 
  isLoadingDocs, 
  isLoadingAnalysis 
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Chat messages with their associated documents and analysis */}
        <div className="space-y-4">
          {chatHistory.map((msg) => (
            <React.Fragment key={msg.id}>
              <ChatMessage message={msg} />
              
              {/* Show documents if this message has them */}
              {msg.documents && (
                <div className="ml-4 mt-2">
                  <DocumentList documents={msg.documents} />
                </div>
              )}
              
              {/* Show analysis if this message has it */}
              {msg.analysis && (
                <div className="ml-4 mt-2 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                  <MarkdownRenderer content={msg.analysis} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Loading states */}
        {isGeneratingSample && (
          <LoadingSpinner message="Generating example case..." />
        )}

        {isLoadingDocs && (
          <LoadingSpinner message="Retrieving documents..." />
        )}

        {isLoadingAnalysis && (
          <LoadingSpinner message="Analyzing documents..." />
        )}
      </div>
    </div>
  );
};

export default ChatContainer;