import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ message, setMessage, handleSendMessage, handleGenerateSampleCase, isLoading }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
        <div className="flex items-center h-full">
          <button
            type="button"
            onClick={handleGenerateSampleCase}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 whitespace-nowrap"
            disabled={isLoading}
          >
            Generate sample case
          </button>
        </div>
        <div className="flex-grow relative flex items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Type your message here..."
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
            disabled={isLoading}
            rows={1}
          />
        </div>
        <div className="flex items-center h-full">
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
            disabled={isLoading || !message.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;