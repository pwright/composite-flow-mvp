import { useState } from "react";

export function useFileUpload() {
  const [error, setError] = useState(null);

  const uploadFile = async () => {
    try {
      setError(null);

      if (!window.showOpenFilePicker) {
        throw new Error("File System Access API not supported. Please use a modern browser or drag and drop a file.");
      }

      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "YAML files",
            accept: {
              "text/yaml": [".yaml", ".yml"],
              "text/plain": [".yaml", ".yml"],
            },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const text = await file.text();

      return { text, filename: file.name };
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[compose-flow] file upload failed", err);
        setError(err.message);
      }
      return null;
    }
  };

  const handleFileDrop = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const file = event.dataTransfer.files[0];
      if (!file) {
        return null;
      }

      if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
        throw new Error("Please upload a YAML file (.yaml or .yml)");
      }

      const text = await file.text();
      return { text, filename: file.name };
    } catch (err) {
      console.error("[compose-flow] file drop failed", err);
      setError(err.message);
      return null;
    }
  };

  return { uploadFile, handleFileDrop, error };
}
