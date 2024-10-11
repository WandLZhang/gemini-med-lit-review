import React from 'react';

const ChatMessage = ({ message }) => {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
          message.isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.isUser ? null : (
          <div className="font-bold mb-1">Assistant</div>
        )}
        <div className="text-sm">
          {message.text}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;