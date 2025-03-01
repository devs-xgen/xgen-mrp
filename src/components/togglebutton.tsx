"use client"; // This line marks the component as a Client Component  

import React, { useState } from 'react';  

// Custom Card Component  
const ToggleableCard = () => {  
  const [isDarkMode, setIsDarkMode] = useState(false);  

  // Function to toggle between dark and light mode  
  const toggleMode = () => {  
    setIsDarkMode((prevMode) => !prevMode);  
  };  

  // Conditional styles based on the theme  
  const cardStyle = {  
    backgroundColor: isDarkMode ? '#333' : '#fff',  
    color: isDarkMode ? '#fff' : '#000',  
    padding: '20px',  
    borderRadius: '8px',  
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',  
    transition: 'background-color 0.3s, color 0.3s',  
  };  

  const buttonStyle = {  
    marginTop: '10px',  
    padding: '10px 20px',  
    border: 'none',  
    borderRadius: '5px',  
    cursor: 'pointer',  
    backgroundColor: isDarkMode ? '#fff' : '#333',  
    color: isDarkMode ? '#000' : '#fff',  
    transition: 'background-color 0.3s, color 0.3s',  
  };  

  return (  
    <div style={cardStyle}>  
      <h2>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</h2>  
      <p>This is a {isDarkMode ? 'dark' : 'light'} mode card.</p>  
      <button style={buttonStyle} onClick={toggleMode}>  
        Switch to {isDarkMode ? 'Light' : 'Dark'} Mode  
      </button>  
    </div>  
  );  
};  

export default ToggleableCard;