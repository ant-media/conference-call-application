import React, { useState } from "react";
import { TextField, Typography } from "@mui/material";

const EditableLabel = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(props.value);

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (event) => {
    const newValue = event.target.value;

    // Only update the value if it's not empty
    if (newValue.trim()) {
        setValue(newValue);
        if (props.onChange) {
        props.onChange(newValue); // Notify the parent component
        }
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setIsEditing(false);
    }
  };

  return (
    <div>
      {isEditing ? (
        <TextField
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          variant="standard"
        />
      ) : (
        <Typography onClick={handleLabelClick} style={{ 
            cursor: "pointer", 
            fontWeight: 500,
            fontSize: 14, 
            }}>
          {value}
        </Typography>
      )}
    </div>
  );
};

export default EditableLabel;
