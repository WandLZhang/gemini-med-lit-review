import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import DocumentList from './components/DocumentList';
import MarkdownRenderer from './components/MarkdownRenderer';
import useTemplates from './hooks/useTemplates';
import { fetchDocuments, fetchAnalysis } from './utils/api';

const MedicalAssistantUI = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, text: "Hello! Go ahead and search clinical research material of interest.", isUser: false },
  ]);
  const [documents, setDocuments] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const { templates, selectedTemplate, setSelectedTemplate, addTemplate, editTemplate } = useTemplates();

  useEffect(() => {
    console.log('MedicalAssistantUI: Templates updated:', templates);
    console.log('MedicalAssistantUI: Selected template:', selectedTemplate);
  }, [templates, selectedTemplate]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (message.trim() && !isLoadingDocs && !isLoadingAnalysis) {
      console.log('MedicalAssistantUI: Sending message:', message);
      console.log('MedicalAssistantUI: Current selected template:', selectedTemplate);

      setChatHistory(prev => [...prev, { id: Date.now(), text: message, isUser: true }]);
      setMessage('');
      setDocuments([]);
      setAnalysis('');
      
      // Fetch documents
      setIsLoadingDocs(true);
      try {
        const docs = await fetchDocuments(message);
        console.log('MedicalAssistantUI: Fetched documents:', docs);
        setDocuments(docs);
        setChatHistory(prev => [...prev, { id: Date.now(), text: "I've retrieved some relevant documents. Analyzing them now...", isUser: false }]);
      } catch (error) {
        console.error('MedicalAssistantUI: Error fetching documents:', error);
        setChatHistory(prev => [...prev, { id: Date.now(), text: "I'm sorry, there was an error retrieving documents. Please try again.", isUser: false }]);
      }
      setIsLoadingDocs(false);

      // Fetch analysis
      setIsLoadingAnalysis(true);
      try {
        const analysisResult = await fetchAnalysis(message, selectedTemplate?.content);
        console.log('MedicalAssistantUI: Fetched analysis:', analysisResult);
        setAnalysis(analysisResult);
        setChatHistory(prev => [...prev, { id: Date.now(), text: "I've completed the analysis. You can view the results below.", isUser: false }]);
      } catch (error) {
        console.error('MedicalAssistantUI: Error fetching analysis:', error);
        setChatHistory(prev => [...prev, { id: Date.now(), text: "I'm sorry, there was an error generating the analysis. Please try again.", isUser: false }]);
      }
      setIsLoadingAnalysis(false);
    }
  }, [message, isLoadingDocs, isLoadingAnalysis, selectedTemplate]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        templates={templates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        addTemplate={addTemplate}
        editTemplate={editTemplate}
      />
      <main className="flex-1 flex flex-col">
        <header className="h-16 p-4 flex justify-between items-center bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800"></h1>
          <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
            Login
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="max-w-3xl mx-auto">
            {chatHistory.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoadingDocs && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Retrieving documents...</span>
              </div>
            )}
            {documents.length > 0 && <DocumentList documents={documents} />}
            {isLoadingAnalysis && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2">Analyzing documents...</span>
              </div>
            )}
            {analysis && (
              <div className="bg-white rounded-lg shadow-md p-6 relative">
                <h2 className="text-2xl font-bold mb-4"> </h2>
                <MarkdownRenderer content={analysis} />
              </div>
            )}
          </div>
        </div>
        <ChatInput 
          message={message} 
          setMessage={setMessage} 
          handleSendMessage={handleSendMessage}
          isLoading={isLoadingDocs || isLoadingAnalysis}
        />
      </main>
    </div>
  );
};

export default MedicalAssistantUI;