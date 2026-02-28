import React, { useState } from "react";
import ReactQuill from "react-quill";
import Toolbar, { modules, formats } from "./Toolbar";
import "react-quill/dist/quill.snow.css";

export const Editor = ({ onChange, value, style }) => {
  return (
    <div className="text-editor">
      <Toolbar />
      <ReactQuill
        theme="snow"
        value={value}
        style={style}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default Editor;