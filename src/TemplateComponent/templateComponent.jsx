import React, { useEffect, useState } from 'react';
import './templateComponent.scss';
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { LuPencil } from "react-icons/lu";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { IoIosArrowBack } from "react-icons/io";
import { MdOutlineDone } from "react-icons/md";
import templateImage from '../utility/template.jpeg'

const TemplateComponent = ({ showTemplate, handleTemplateContentChange, setShowTemplateComponent}) => {
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

  return (
    <div className={modalVisible? 'modalContainer': 'templateContainer'}>
      {allTemplates.length === 0 ? (
        <div className="templateInnerContainer">
          <img src={templateImage} alt="Template" />
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
                  <button onClick={() => handleTemplateContentChange(template.twiliophonenumbervalidatorbyupro__SMS_Content)}>
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
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
          <button className='modalBackButton' onClick={() => setModalVisible(false)}><IoIosArrowBack /></button>
            <h4 style={{marginLeft: '20px'}}>{isEditing ? 'Edit Template' : 'Add Template'}</h4>
            </div>
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
  // const [allTemplates, setAllTemplates] = useState([]); // List of templates
  // const [currentPage, setCurrentPage] = useState(1); // Current page
  // const [editingTemplateId, setEditingTemplateId] = useState(null); // ID of the template being edited
  // const [newTemplate, setNewTemplate] = useState({ Name: "", twiliophonenumbervalidatorbyupro__SMS_Content: "" }); // New template state
  // const [error, setError] = useState(""); // Error handling
  // const [addNew, setAddNew] = useState(false);
  // const perPage = 3; // Number of records per page

  // useEffect(() => {
  //   fetchAllRecords(); // Fetch records for the first page
  // }, [showTemplate]);

  // const fetchAllRecords = async () => {
  //   try {
  //     const response = await ZOHO.CRM.API.getAllRecords({
  //       Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
  //       sort_order: 'asc',
  //       per_page: 200,
  //       page: 1,
  //     });
  //     setAllTemplates(response.data || []); // Update templates
  //   } catch (error) {
  //     console.error('Error fetching records:', error);
  //   }
  // };

  // // Handle pagination
  // const handlePageChange = (direction) => {
  //   const newPage = currentPage + direction;
  //   const totalPages = Math.ceil(allTemplates.length / perPage);
  //   if (newPage > 0 && newPage <= totalPages) {
  //     setCurrentPage(newPage); // Update the current page
  //   }
  // };

  // // Function to delete a template
  // const deleteTemplate = async (id) => {
  //   try {
  //     await ZOHO.CRM.API.deleteRecord({
  //       Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
  //       RecordID: id,
  //     });
  //     setAllTemplates(allTemplates.filter(template => template.id !== id)); // Update list
  //   } catch (error) {
  //     console.error('Error deleting template:', error);
  //   }
  // };

  // // Handle edit click
  // const handleEditClick = (templateId) => {
  //   setEditingTemplateId(templateId);
  // };

  // // Save template (edit existing)
  // const handleSaveEdit = async (templateId) => {
  //   const template = allTemplates.find(t => t.id === templateId);
  //   if (!template?.Name || !template?.twiliophonenumbervalidatorbyupro__SMS_Content) {
  //     setError("Both title and content are required.");
  //     return;
  //   }

  //   try {
  //     await ZOHO.CRM.API.updateRecord({
  //       Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
  //       APIData: {
  //         id: template.id,
  //         Name: template.Name,
  //         twiliophonenumbervalidatorbyupro__SMS_Content: template.twiliophonenumbervalidatorbyupro__SMS_Content,
  //       },
  //     });
  //     setEditingTemplateId(null);
  //     setError("");
  //   } catch (error) {
  //     console.error('Error saving template:', error);
  //   }
  // };

  // // Handle adding a new template
  // const handleAddNewTemplate = async () => {
  //   if (!newTemplate.Name || !newTemplate.twiliophonenumbervalidatorbyupro__SMS_Content) {
  //     setError("Both title and content are required.");
  //     return;
  //   }

  //   try {
  //     const response = await ZOHO.CRM.API.insertRecord({
  //       Entity: 'twiliophonenumbervalidatorbyupro__SMS_Templates',
  //       APIData: newTemplate,
  //     });

  //     if (response.data) {
  //       setAllTemplates([...allTemplates, response.data]);
  //     }

  //     setNewTemplate({ Name: "", twiliophonenumbervalidatorbyupro__SMS_Content: "" });
  //     setError("");
  //   } catch (error) {
  //     console.error('Error adding template:', error);
  //   }
  // };
  // const handleAddClick = () => {
  //   setAddNew(true)
  // }

  // const handleCancelClick = () => {
  //      setShowTemplateComponent(false)
  //   }

  // return (
  //   <div className='templateContainer'>
  //     {allTemplates.length === 0 ? (
  //       <div className="templateInnerContainer">
  //         <p>Make your task easy by creating some templates.</p>
  //       </div>
  //     ) : (
  //       <div className="templateInnerContainer">
  //         <div className="pagination">
  //           <button
  //             onClick={() => handlePageChange(-1)}
  //             className="teamplatePreviousButton"
  //             disabled={currentPage === 1}
  //           >
  //             <IoIosArrowDropleft />
  //           </button>

  //           {allTemplates.slice((currentPage - 1) * perPage, currentPage * perPage).map((template) => (
  //             {
  //               addNew && (
  //                 <div className="newTemplate">
  //         <input
  //           type="text"
  //           value={newTemplate.Name}
  //           onChange={(e) => setNewTemplate({ ...newTemplate, Name: e.target.value })}
  //           placeholder="New Template Name"
  //         />
  //         <textarea
  //           value={newTemplate.twiliophonenumbervalidatorbyupro__SMS_Content}
  //           onChange={(e) => setNewTemplate({ ...newTemplate, twiliophonenumbervalidatorbyupro__SMS_Content: e.target.value })}
  //           placeholder="Type new template content..."
  //         />
  //         <div className="newTemplateActionButton">
  //         <button className="addButton" onClick={handleAddNewTemplate}>
  //           <MdOutlineDone />
  //         </button>
  //         <button className="addButton" onClick={() => setAddNew(false)}>
  //         <RxCross2 />
  //         </button>
  //         </div>
          
  //       </div>
  //               )
  //             }
  //             <div key={template.id} className="template">
  //               {editingTemplateId === template.id ? (
  //                 <>
  //                   <input
  //                     type="text"
  //                     value={template.Name}
  //                     onChange={(e) =>
  //                       setAllTemplates(allTemplates.map(t => t.id === template.id ? { ...t, Name: e.target.value } : t))
  //                     }
  //                     placeholder="Template Name"
  //                   />
  //                   <textarea
  //                     value={template.twiliophonenumbervalidatorbyupro__SMS_Content}
  //                     onChange={(e) =>
  //                       setAllTemplates(allTemplates.map(t => t.id === template.id ? { ...t, twiliophonenumbervalidatorbyupro__SMS_Content: e.target.value } : t))
  //                     }
  //                     placeholder="Type your content here..."
  //                   />
  //                   <div className="templateActions">
  //                     <button onClick={() => handleSaveEdit(template.id)}>
  //                       <MdOutlineDone />
  //                     </button>
  //                     <button onClick={() => setEditingTemplateId(null)}>
  //                       <RxCross2 />
  //                     </button>
  //                   </div>
  //                 </>
  //               ) : (
  //                 <>
  //                   <div className="templateHeader">
  //                     <h5>{template.Name}</h5>
  //                     <div className="templateActions">
  //                       <button onClick={() => handleTemplateContentChange(template.twiliophonenumbervalidatorbyupro__SMS_Content)}>
  //                         <MdOutlineDone />
  //                       </button>
  //                       <button onClick={() => handleEditClick(template.id)}>
  //                         <LuPencil />
  //                       </button>
  //                       <button onClick={() => deleteTemplate(template.id)}>
  //                         <RiDeleteBin6Line />
  //                       </button>
  //                     </div>
  //                   </div>
  //                   <div className="templateContent">{template.twiliophonenumbervalidatorbyupro__SMS_Content}</div>
  //                 </>
  //               )}
  //             </div>
  //           ))}

  //           <button
  //             onClick={() => handlePageChange(1)}
  //             className="teamplatePreviousButton"
  //             disabled={currentPage === Math.ceil(allTemplates.length / perPage)}
  //           >
  //             <IoIosArrowDropright />
  //           </button>
  //         </div>
  //         <div className="templateActionButton">
  //            <button
  //              className="teamplateAddButton"
  //              style={{ transform: 'rotate(45deg)' }}
  //              onClick={handleAddClick}
  //            >
  //              <RxCross2 />
  //            </button>
  //            <button
  //              className="teamplateAddButton"
  //              onClick={handleCancelClick}
  //            >
  //              <RxCross2 />
  //            </button>
  //          </div>
  //       </div>
  //     )}
  //   </div>
  //);
};

export default TemplateComponent;
