import React, { useEffect, useRef, useState } from "react";
import JoditEditor from "jodit-react";

const TextEditor = ({ value, onTextChange, placeholder, height, disableMinHeight }) => {
  const editor = useRef(null);

  const config = {
    height: height || 400,
    minHeight: disableMinHeight ? 0 : 400,
    maxHeight: 600,
    placeholder: placeholder || "Start writing your blog...",
    buttons: "bold,italic,underline,|,ul,ol,|,link,undo,redo", // Essential formatting tools
    showXPathInStatusbar: false,
    showCharsCounter: false,
    showWordsCounter: false,
    toolbarSticky: false,
    toolbarAdaptive: false,
  };

  return (
    <JoditEditor
      ref={editor}
      value={value}
      config={config}
      onBlur={(newContent) => {
        onTextChange(newContent);
      }}
    />
  );
};

export default TextEditor;
