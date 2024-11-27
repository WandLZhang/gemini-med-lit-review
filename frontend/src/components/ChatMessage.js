// src/components/ChatMessage.js

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);

  const isError = message.text && message.text.includes("I'm sorry, there was an error");

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
          isError 
            ? 'bg-red-50 border border-red-200 text-red-800'
            : message.isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.isUser ? null : (
          <div className="font-bold mb-1 flex items-center gap-2">
            {isError && <AlertCircle className="h-4 w-4" />}
            Assistant
          </div>
        )}
        <div className="text-sm">
          {message.text || ''}
          {isError && !isErrorExpanded && (
            <button 
              onClick={() => setIsErrorExpanded(true)}
              className="ml-2 text-red-600 hover:text-red-800 underline text-sm"
            >
              Show Details
            </button>
          )}
          {isError && isErrorExpanded && (
            <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
              Error Details:
              <pre className="mt-1 whitespace-pre-wrap">
                {message.error || "No additional error details available"}
              </pre>
              <button 
                onClick={() => setIsErrorExpanded(false)}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Hide Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
