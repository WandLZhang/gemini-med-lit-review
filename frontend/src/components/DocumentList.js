import React from 'react';

const DocumentList = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 className="text-lg font-bold mb-4">Retrieved Documents:</h2>
      {documents.map((doc, index) => (
        <div key={index} className="mb-4 last:mb-0">
          <h3 className="font-semibold text-blue-600">{doc.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {doc.content.length > 200
              ? `${doc.content.substring(0, 200)}...`
              : doc.content}
          </p>
          {doc.content.length > 200 && (
            <button
              className="text-blue-500 hover:text-blue-700 text-sm mt-1"
              onClick={() => alert('Full content: ' + doc.content)}
            >
              Read more
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default DocumentList;