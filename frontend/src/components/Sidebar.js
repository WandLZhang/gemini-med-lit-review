import React, { useState, useEffect } from 'react';
import { Edit, Plus, X } from 'lucide-react';

const Sidebar = ({ templates, selectedTemplate, setSelectedTemplate, addTemplate, editTemplate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('Sidebar: Templates received:', templates);
    console.log('Sidebar: Selected template received:', selectedTemplate);
  }, [templates, selectedTemplate]);

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

  return (
    <aside className="w-64 flex-shrink-0 bg-white shadow-md flex flex-col h-full">
      <div className="h-16 p-4 flex items-center justify-between border-b">
        <div className="text-sm font-semibold">Medical Research Assistant</div>
      </div>
      
      {/* Main content with overflow */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="mt-8">
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
      </div>

      {/* Footer */}
      <div className="border-gray-200 p-3 mt-auto">
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

      {/* Modal */}
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