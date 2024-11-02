import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import DocumentList from './components/DocumentList';
import MarkdownRenderer from './components/MarkdownRenderer';
import useTemplates from './hooks/useTemplates';
import { fetchDocuments, fetchAnalysis, generateSampleCase } from './utils/api';

const MedicalAssistantUI = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, text: "Hello! Go ahead and search clinical research material of interest.", isUser: false },
  ]);
  const [documents, setDocuments] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const { templates, selectedTemplate, setSelectedTemplate, addTemplate, editTemplate } = useTemplates();

  useEffect(() => {
    console.log('MedicalAssistantUI: Templates updated:', templates);
    console.log('MedicalAssistantUI: Selected template:', selectedTemplate);
  }, [templates, selectedTemplate]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (message.trim() && !isLoadingDocs && !isLoadingAnalysis) {
      // Add user message to chat
      const userMessage = message;
      setChatHistory(prev => [...prev, { id: Date.now(), text: userMessage, isUser: true }]);
      setMessage('');
      setDocuments([]);
      setAnalysis('');
      
      // Start documents fetch
      setIsLoadingDocs(true);
      try {
        const docs = await fetchDocuments(userMessage);
        setIsLoadingDocs(false);
        setDocuments(docs);
        setChatHistory(prev => [...prev, { 
          id: Date.now(), 
          text: "I've retrieved some relevant documents. Analyzing them now...", 
          isUser: false 
        }]);

        // Start analysis
        setIsLoadingAnalysis(true);
        try {
          const analysisResult = await fetchAnalysis(userMessage, selectedTemplate?.content);
          setAnalysis(analysisResult);
          setChatHistory(prev => [...prev, { 
            id: Date.now(), 
            text: "I've completed the analysis. You can view the results below.", 
            isUser: false 
          }]);
        } catch (error) {
          console.error('MedicalAssistantUI: Error fetching analysis:', error);
          setChatHistory(prev => [...prev, { 
            id: Date.now(), 
            text: "I'm sorry, there was an error generating the analysis. Please try again.", 
            isUser: false 
          }]);
        }
        setIsLoadingAnalysis(false);
      } catch (error) {
        console.error('MedicalAssistantUI: Error fetching documents:', error);
        setIsLoadingDocs(false);
        setChatHistory(prev => [...prev, { 
          id: Date.now(), 
          text: "I'm sorry, there was an error retrieving documents. Please try again.", 
          isUser: false 
        }]);
      }
    }
  }, [message, isLoadingDocs, isLoadingAnalysis, selectedTemplate]);

  const handleGenerateSampleCase = useCallback(async () => {
    setIsGeneratingSample(true);
    try {
      const sampleCase = await generateSampleCase();
      setMessage(sampleCase);
    } catch (error) {
      console.error('MedicalAssistantUI: Error generating sample case:', error);
      setChatHistory(prev => [...prev, { 
        id: Date.now(), 
        text: "I'm sorry, there was an error generating a sample case. Please try again.", 
        isUser: false 
      }]);
    }
    setIsGeneratingSample(false);
  }, []);

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
          <h1 className="text-xl font-semibold text-gray-800">Medical Research Assistant</h1>
          <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
            Login
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Initial chat messages only */}
            <div className="space-y-4">
              {chatHistory
                .filter(msg => !msg.text.includes("I've completed the analysis"))
                .map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>

            {/* Sample case generation loading state */}
            {isGeneratingSample && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2">Generating example case...</span>
              </div>
            )}

            {/* Documents section */}
            {isLoadingDocs && (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Retrieving documents...</span>
              </div>
            )}
            {documents.length > 0 && !isLoadingDocs && (
              <DocumentList documents={documents} />
            )}
            {/* Analysis completion message */}
            {documents.length > 0 && !isLoadingDocs && !isLoadingAnalysis && analysis && (
              <div className="my-4">
                <ChatMessage 
                  message={{ 
                    id: 'analysis-complete', 
                    text: "I've completed the analysis. You can view the results below.", 
                    isUser: false 
                  }} 
                />
              </div>
            )}

            {/* Analysis section */}
            {isLoadingAnalysis && (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2">Analyzing documents...</span>
              </div>
            )}
            {analysis && !isLoadingAnalysis && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                <MarkdownRenderer content={analysis} />
              </div>
            )}
          </div>
        </div>
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