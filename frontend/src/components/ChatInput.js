import React from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ message, setMessage, handleSendMessage, handleGenerateSampleCase, isLoading }) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleGenerateSampleCase}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
          disabled={isLoading}
        >
          Generate sample case
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
          disabled={isLoading || !message.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
