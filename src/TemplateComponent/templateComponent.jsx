import React, { useEffect, useState } from 'react';
import './templateComponent.scss';

const TemplateComponent = ({ showTemplate, handleTemplateContentChange }) => {
  // State variables to manage templates, modal visibility, and pagination
  const [templates, setTemplates] = useState([]); // List of templates
  const [templateContent, setTemplateContent] = useState(''); // Current template content
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [editingTemplate, setEditingTemplate] = useState(null); // Current template being edited/added
  const [isEditing, setIsEditing] = useState(false); // Flag to check if editing or adding

  // Fetch all templates whenever showTemplate changes
  useEffect(() => {
    fetchAllRecords();
  }, [showTemplate]);

  // Function to fetch all records from Zoho CRM API
  const fetchAllRecords = async (page = 1) => {
    try {
      const allRecords = await ZOHO.CRM.API.getAllRecords({
        Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
        sort_order: 'asc',
        per_page: 5, // Limit number of records per page
        page, // Current page
      });
      setTemplates(allRecords.data || []); // Update templates state
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Function to delete a template by ID
  const deleteTemplate = async (id) => {
    try {
      await ZOHO.CRM.API.deleteRecord({
        Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
        RecordID: id,
      });
      fetchAllRecords(currentPage); // Refresh templates after deletion
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Handle click on the edit button
  const handleEditClick = (template) => {
    setIsEditing(true); // Set editing mode
    setEditingTemplate(template); // Set the selected template for editing
    setModalVisible(true); // Show modal
  };

  // Handle click on the add button
  const handleAddClick = () => {
    setIsEditing(false); // Set adding mode
    // Set an empty template for the form
    setEditingTemplate({ Name: '', twiliophonenumbervalidatorbyupro__SMS_Content: '' });
    setModalVisible(true); // Show modal
  };

  // Save the template (add or update based on mode)
  const handleSaveTemplate = async () => {
    try {
      if (isEditing) {
        // Update existing template
        await ZOHO.CRM.API.updateRecord({
          Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
          // RecordID: editingTemplate.id,
          APIData: {
            id: editingTemplate.id,
            Name: editingTemplate.Name,
            twiliophonenumbervalidatorbyupro__SMS_Content:
              editingTemplate.twiliophonenumbervalidatorbyupro__SMS_Content,
          },
        });
      } else {
        // Insert new template
        await ZOHO.CRM.API.insertRecord({
          Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
          APIData: {
            Name: editingTemplate.Name,
            twiliophonenumbervalidatorbyupro__SMS_Content:
              editingTemplate.twiliophonenumbervalidatorbyupro__SMS_Content,
          },
        });
      }

      fetchAllRecords(currentPage); // Refresh templates after saving
      setModalVisible(false); // Close modal
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  // Set the template content when a template is clicked
  const handleTemplateClick = (content) => {
    setTemplateContent(content); // Update content state
  };

  // Handle pagination
  const handlePageChange = (direction) => {
    const newPage = currentPage + direction;
    if (newPage > 0) { // Ensure page number is positive
      setCurrentPage(newPage); // Update current page
      fetchAllRecords(newPage); // Fetch records for the new page
    }
  };

  return (
    <div className="templateContainer">
      {/* Show message if no templates exist */}
      {templates.length === 0 ? (
        <div>
          <p>Make your task easy by creating some templates.</p>
          <button onClick={handleAddClick}>Add</button>
        </div>
      ) : (
        <div className='templateInnerContainer'>
          {/* Add button for adding new templates */}
          <button onClick={handleAddClick}>Add</button>
          {/* Pagination controls */}
          <div className="pagination">
            <button onClick={() => handlePageChange(-1)}>Previous</button>
            {/* Render each template */}
          {templates.map((template) => (
            <div
              key={template.id}
              className="template"
              onClick={() => handleTemplateContentChange(template.twiliophonenumbervalidatorbyupro__SMS_Content)}
            >
              <h5>{template.Name}</h5>
              <div className="templateActions">
                <button onClick={() => handleEditClick(template)}>Edit</button>
                <button onClick={() => deleteTemplate(template.id)}>Delete</button>
              </div>
            </div>
          ))}
            <button onClick={() => handlePageChange(1)}>Next</button>
          </div>
        </div>
      )}

      {/* Modal for Editing/Adding Templates */}
      {modalVisible && (
        <div className="modal">
          <div className="modalContent">
            <h4>{isEditing ? 'Edit Template' : 'Add Template'}</h4>
            <input
              type="text"
              placeholder="Template Name"
              value={editingTemplate?.Name || ''}
              onChange={(e) =>
                setEditingTemplate({ ...editingTemplate, Name: e.target.value })
              }
            />
            <textarea
              placeholder="Template Content"
              value={
                editingTemplate?.twiliophonenumbervalidatorbyupro__SMS_Content || ''
              }
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  twiliophonenumbervalidatorbyupro__SMS_Content: e.target.value,
                })
              }
            />
            <button onClick={handleSaveTemplate}>Save</button>
            <button onClick={() => setModalVisible(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateComponent;
