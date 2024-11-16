import React, { useState, useEffect } from 'react';
import { Edit, Plus, X, MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { getUserChats, deleteChat, updateChatTitle, createNewChat } from '../firebase';

const formatChatTitle = (chat) => {
  // If chat has a custom title, use it
  if (chat.title) return chat.title;
  
  // Otherwise, use the creation timestamp
  let timestamp;
  if (chat.createdAt?.seconds) {
    // Handle Firestore timestamp
    timestamp = new Date(chat.createdAt.seconds * 1000);
  } else if (chat.createdAt instanceof Date) {
    // Handle regular Date object
    timestamp = chat.createdAt;
  } else {
    // Fallback to current time if no valid timestamp
    timestamp = new Date();
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(timestamp);
};

const ChatHistoryItem = ({ chat, isActive, onClick, onRename, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title || '');

  const handleRename = async (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      await onRename(chat.id, newTitle.trim());
      setIsRenaming(false);
    }
  };

  if (isRenaming) {
    return (
      <form onSubmit={handleRename} className="p-1">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter chat title"
          className="w-full px-2 py-1 text-sm border rounded"
          autoFocus
          onBlur={() => setIsRenaming(false)}
        />
      </form>
    );
  }

  return (
    <div 
      className={`group flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md ${
        isActive ? 'bg-gray-100' : ''
      }`}
    >
      <button
        onClick={onClick}
        className="flex items-center flex-grow overflow-hidden"
      >
        <MessageSquare size={16} className="mr-2 flex-shrink-0" />
        <span className="truncate">
          {formatChatTitle(chat)}
        </span>
      </button>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsRenaming(true);
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chat.id);
          }}
          className="p-1 hover:bg-gray-200 rounded text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ 
  templates, 
  selectedTemplate, 
  setSelectedTemplate, 
  addTemplate, 
  editTemplate,
  user,
  onChatSelect,
  activeChat,
  initializeNewChat
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    console.log('Sidebar: Templates received:', templates);
    console.log('Sidebar: Selected template received:', selectedTemplate);
  }, [templates, selectedTemplate]);

  useEffect(() => {
    const loadChats = async () => {
      if (user) {
        const userChats = await getUserChats(user.uid);
        setChats(userChats);
      }
    };
    loadChats();
  }, [user]);

  const handleTemplateChange = (e) => {
    const value = e.target.value;
    console.log('Sidebar: Template selected:', value);
    const newSelectedTemplate = templates.find(t => t.name === value) || null;
    setSelectedTemplate(newSelectedTemplate);
    console.log('Sidebar: New selected template:', newSelectedTemplate);
  };

  const handleSaveTemplate = () => {
    console.log('Sidebar: Saving template:', editingTemplate);
    if (editingTemplate.name && editingTemplate.content) {
      if (editingTemplate.id) {
        editTemplate(editingTemplate.id, editingTemplate);
      } else {
        addTemplate(editingTemplate);
      }
      setIsEditing(false);
      setEditingTemplate(null);
      setIsModalOpen(false);
    }
  };

  const openModal = (template = null) => {
    setEditingTemplate(template || { name: '', content: '' });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsEditing(false);
    setEditingTemplate(null);
    setIsModalOpen(false);
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      await updateChatTitle(user.uid, chatId, newTitle);
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteChat(user.uid, chatId);
        setChats(chats.filter(chat => chat.id !== chatId));
        if (activeChat?.id === chatId) {
          onChatSelect(null);
        }
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  };

  const handleNewChat = async () => {
    if (user) {
      try {
        const chatId = await initializeNewChat();
        const newChat = {
          id: chatId,
          createdAt: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
          },
          messages: []  // Add empty messages array
        };
        setChats(prevChats => [newChat, ...prevChats]);
        onChatSelect(newChat);
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white shadow-md flex flex-col h-full">
      <div className="h-16 p-4 flex items-center justify-between border-b">
        <div className="text-sm font-semibold">Medical Research Assistant</div>
      </div>
      
      {/* Main content with overflow */}
      <div className="flex-grow overflow-y-auto p-4 space-y-8">
        {/* Templates Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assistant Templates</h2>
          <select 
            className="w-full bg-gray-100 rounded p-2 text-sm mb-2"
            value={selectedTemplate ? selectedTemplate.name : ""}
            onChange={handleTemplateChange}
          >
            <option value="">Select a template</option>
            {templates.map(temp => (
              <option key={temp.id} value={temp.name}>{temp.name}</option>
            ))}
          </select>
          <div className="bg-gray-50 rounded p-2 text-sm h-40 overflow-y-auto">
            {selectedTemplate ? selectedTemplate.content : "Select a template to view its contents"}
          </div>
          <div className="mt-2 flex justify-between">
            <button 
              onClick={() => openModal(selectedTemplate)}
              className="flex items-center text-blue-500 hover:text-blue-600"
            >
              <Edit size={16} className="mr-1" /> Edit
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center text-green-500 hover:text-green-600"
            >
              <Plus size={16} className="mr-1" /> New
            </button>
          </div>
        </div>

        {/* Chat History Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Chat History
          </h2>
          <div className="space-y-2">
            {user ? (
              <>
                {/* Update the Start New Chat button */}
                <button
                  onClick={handleNewChat}
                  className="flex items-center w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-md"
                >
                  <Plus size={16} className="mr-2" />
                  Start New Chat
                </button>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {chats.map((chat) => (
                    <ChatHistoryItem
                      key={chat.id}
                      chat={chat}
                      isActive={activeChat?.id === chat.id}
                      onClick={() => onChatSelect(chat)}
                      onRename={handleRenameChat}
                      onDelete={handleDeleteChat}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 px-3 py-2">
                Sign in to view chat history
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 mt-auto">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <img 
              src="/maxima-logo.png" 
              alt="Prinses Máxima Centrum logo" 
              className="h-6 w-auto"
            />
            <span className="text-sm text-gray-600">
              In collaboration with Prinses Máxima Centrum
            </span>
          </div>
        </div>
      </div>

      {/* Template Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingTemplate.id ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Template Name"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
              className="w-full p-2 mb-4 border rounded"
            />
            <textarea
              placeholder="Template Content"
              value={editingTemplate.content}
              onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
              className="w-full p-2 mb-4 border rounded h-64"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSaveTemplate}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;