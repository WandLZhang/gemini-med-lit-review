import React from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ message, setMessage, handleSendMessage, isLoading }) => {
  return (
    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your clinical research question here..."
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={`px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            isLoading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;