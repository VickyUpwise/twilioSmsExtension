import React, { useEffect, useState } from 'react';
import './templateComponent.scss';
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { LuPencil } from "react-icons/lu";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { IoIosArrowBack } from "react-icons/io";
import { MdOutlineDone } from "react-icons/md";

const TemplateComponent = ({ showTemplate, handleTemplateContentChange, setShowTemplateComponent, setNewMessage}) => {
  const [allTemplates, setAllTemplates] = useState([]); // List of templates
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility
  const [editingTemplate, setEditingTemplate] = useState(null); // Template being edited
  const [isEditing, setIsEditing] = useState(false); // Edit mode or Add mode
  const perPage = 3; // Number of records per page

  // Current templates for the page
  const currentTemplates = allTemplates.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    fetchAllRecords(); // Fetch records for the first page
  }, [showTemplate]);

  // Function to fetch records for the current page
  const fetchAllRecords = async () => {
    try {
      const response = await ZOHO.CRM.API.getAllRecords({
        Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
        sort_order: 'asc',
        per_page: 200,
        page: 1,
      });
      setAllTemplates(response.data || []); // Update templates
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  // Handle pagination
  const handlePageChange = (direction) => {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(allTemplates.length / perPage);

    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage); // Update the current page
    }
  };

  // Function to delete a template
  const deleteTemplate = async (id) => {
    try {
      await ZOHO.CRM.API.deleteRecord({
        Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
        RecordID: id,
      });
      const updatedTemplates = allTemplates.filter((template) => template.id !== id);
      setAllTemplates(updatedTemplates); // Update the templates after deletion
      if (currentPage > Math.ceil(updatedTemplates.length / perPage)) {
        setCurrentPage((prev) => prev - 1); // Adjust the page if needed
      } // Refresh templates
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Handle edit click
  const handleEditClick = (template) => {
    setIsEditing(true);
    setEditingTemplate(template);
    setModalVisible(true);
  };

  // Handle add click
  const handleAddClick = () => {
    setIsEditing(false);
    setEditingTemplate({ Name: '', twiliophonenumbervalidatorbyupro__SMS_Content: '' });
    setModalVisible(true);
  };

  // Save template (add or update)
  const handleSaveTemplate = async () => {
    try {
      if (isEditing) {
        await ZOHO.CRM.API.updateRecord({
          Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
          APIData: {
            id: editingTemplate.id,
            Name: editingTemplate.Name,
            twiliophonenumbervalidatorbyupro__SMS_Content: editingTemplate.twiliophonenumbervalidatorbyupro__SMS_Content,
          },
        });
      } else {
        await ZOHO.CRM.API.insertRecord({
          Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
          APIData: {
            Name: editingTemplate.Name,
            twiliophonenumbervalidatorbyupro__SMS_Content: editingTemplate.twiliophonenumbervalidatorbyupro__SMS_Content,
          },
        });
      }
      fetchAllRecords();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleCancelClick = () => {
    setShowTemplateComponent(false)
  }

  const handleTemplateSelected = (message) => {
    setNewMessage(message)
  }

  return (
    <div className={modalVisible? 'modalContainer': 'templateContainer'}>
      {allTemplates.length === 0 ? (
        <div className="templateInnerContainer">
          <p>Make your task easy by creating some templates.</p>
          <div className="templateActionButton">
            <button
              className="teamplateAddButton"
              style={{ transform: 'rotate(45deg)' }}
              onClick={handleAddClick}
            >
              <RxCross2 />
            </button>
            <button
              className="teamplateAddButton"
              onClick={handleCancelClick}
            >
              <RxCross2 />
            </button>
          </div>
        </div>
      ) : !modalVisible && (
        <div className="templateInnerContainer">
          <div className="pagination">
            <button
              onClick={() => handlePageChange(-1)}
              className="teamplatePreviousButton"
              disabled={currentPage === 1}
              style={{ left: '0rem' }}
            >
              <IoIosArrowDropleft />
            </button>
            {currentTemplates.map((template) => (
              <div
                key={template.id}
                className="template"
                // onClick={() =>
                //   handleTemplateContentChange(
                //     template.twiliophonenumbervalidatorbyupro__SMS_Content
                //   )
                // }
              >
                <div className="templateHeader">
                  <h5>{template.Name}</h5>
                  <div className="templateActions">
                  <button onClick={() => handleTemplateSelected(template.twiliophonenumbervalidatorbyupro__SMS_Content)}>
                  <MdOutlineDone />
                    </button>
                    <button onClick={() => handleEditClick(template)}>
                      <LuPencil />
                    </button>
                    <button onClick={() => deleteTemplate(template.id)}>
                      <RiDeleteBin6Line />
                    </button>
                  </div>
                </div>
                <div className='templateContent'>{template.twiliophonenumbervalidatorbyupro__SMS_Content}</div>
              </div>
            ))}
          
            <button
              onClick={() => handlePageChange(1)}
              className="teamplatePreviousButton"
              disabled={currentPage === Math.ceil(allTemplates.length / perPage)}
              style={{ right: '0rem' }}
            >
              <IoIosArrowDropright />
            </button>
          </div>
          <div className="templateActionButton">
            <button
              className="teamplateAddButton"
              style={{ transform: 'rotate(45deg)' }}
              onClick={handleAddClick}
            >
              <RxCross2 />
            </button>
            <button
              className="teamplateAddButton"
              onClick={handleCancelClick}
            >
              <RxCross2 />
            </button>
          </div>
        </div>
      )}

      {modalVisible && (
        <div className="modal">
          <div className="modalContent">
          <button className='modalBackButton' onClick={() => setModalVisible(false)}><IoIosArrowBack /></button>
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
              placeholder="type your content here....."
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
            <div className='saveButtonContainer'>
            <button className='modalSaveButton' onClick={handleSaveTemplate}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateComponent;
