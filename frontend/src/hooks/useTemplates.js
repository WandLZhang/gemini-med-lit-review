// src/hooks/useTemplates.js

import { useState, useEffect } from 'react';
import { pediatricOncologyTemplate } from '../templates/pediatricOncology';
import { gastrointestinalPathologyTemplate } from '../templates/gastrointestinalPathology';
import { pediatricHematologyTemplate } from '../templates/pediatricHematology';

const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    console.log('useTemplates: Initializing templates');
    const defaultTemplates = [
      { id: '1', name: 'Pediatric Oncology', content: pediatricOncologyTemplate },
      { id: '2', name: 'Gastrointestinal Pathology', content: gastrointestinalPathologyTemplate },
      { id: '3', name: 'Pediatric Hematology', content: pediatricHematologyTemplate }
    ];
    
    console.log('useTemplates: Default templates:', defaultTemplates);
    setTemplates(defaultTemplates);

    // Set the default selected template
    setSelectedTemplate(defaultTemplates[0]);
    console.log('useTemplates: Set default selected template:', defaultTemplates[0]);
  }, []);

  const addTemplate = (newTemplate) => {
    console.log('useTemplates: Adding new template:', newTemplate);
    const templateWithId = { ...newTemplate, id: Date.now().toString() };
    setTemplates(prevTemplates => {
      const updatedTemplates = [...prevTemplates, templateWithId];
      console.log('useTemplates: Updated templates after adding:', updatedTemplates);
      return updatedTemplates;
    });
  };

  const editTemplate = (id, updatedTemplate) => {
    console.log(`useTemplates: Editing template with id ${id}:`, updatedTemplate);
    setTemplates(prevTemplates => {
      const updatedTemplates = prevTemplates.map(template =>
        template.id === id ? { ...template, ...updatedTemplate } : template
      );
      console.log('useTemplates: Updated templates after editing:', updatedTemplates);
      return updatedTemplates;
    });
    if (selectedTemplate && selectedTemplate.id === id) {
      setSelectedTemplate({ ...selectedTemplate, ...updatedTemplate });
      console.log('useTemplates: Updated selected template:', { ...selectedTemplate, ...updatedTemplate });
    }
  };

  const deleteTemplate = (id) => {
    console.log(`useTemplates: Deleting template with id ${id}`);
    setTemplates(prevTemplates => {
      const updatedTemplates = prevTemplates.filter(template => template.id !== id);
      console.log('useTemplates: Updated templates after deleting:', updatedTemplates);
      return updatedTemplates;
    });
    if (selectedTemplate && selectedTemplate.id === id) {
      const newSelectedTemplate = templates[0] || null;
      setSelectedTemplate(newSelectedTemplate);
      console.log('useTemplates: Updated selected template after deletion:', newSelectedTemplate);
    }
  };

//  console.log('useTemplates: Current state - templates:', templates, 'selectedTemplate:', selectedTemplate);

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    addTemplate,
    editTemplate,
    deleteTemplate
  };
};

export default useTemplates;
