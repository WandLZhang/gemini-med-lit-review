// src/MedicalAssistantUI.js
import React, { useState } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/Chat/ChatContainer';
import ChatInput from './components/ChatInput';
import { useAuth } from './hooks/useAuth';
import useChat from './hooks/useChat';
import useTemplates from './hooks/useTemplates';
import { generateSampleCase } from './utils/api';

const MedicalAssistantUI = ({ user }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const { handleLogin, handleLogout } = useAuth(setShowUserMenu);
  const { 
    templates, 
    selectedTemplate, 
    setSelectedTemplate, 
    addTemplate, 
    editTemplate,
    deleteTemplate
  } = useTemplates();
  
  const {
    chatHistory,
    isLoadingDocs,
    isLoadingAnalysis,
    activeChat,
    message,
    setMessage,
    handleChatSelect,
    handleSendMessage,
    initializeNewChat  // Get the new function from useChat
  } = useChat(user, selectedTemplate);

  const handleGenerateSampleCase = async () => {
    setIsGeneratingSample(true);
    try {
      const sampleCase = await generateSampleCase();
      setMessage(sampleCase);
    } catch (error) {
      console.error('Error generating sample case:', error);
    }
    setIsGeneratingSample(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        templates={templates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        addTemplate={addTemplate}
        editTemplate={editTemplate}
        deleteTemplate={deleteTemplate}
        user={user}
        onChatSelect={handleChatSelect}
        activeChat={activeChat}
        initializeNewChat={initializeNewChat}  // Pass the new function to Sidebar
      />
      <main className="flex-1 flex flex-col">
        <Header 
          user={user}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
        />
        <ChatContainer 
          chatHistory={chatHistory}
          isGeneratingSample={isGeneratingSample}
          isLoadingDocs={isLoadingDocs}
          isLoadingAnalysis={isLoadingAnalysis}
        />
        <ChatInput 
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          handleGenerateSampleCase={handleGenerateSampleCase}
          isLoading={isLoadingDocs || isLoadingAnalysis || isGeneratingSample}
        />
      </main>
    </div>
  );
};

export default MedicalAssistantUI;