import React, { useRef, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { X } from "lucide-react";

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  disabled?: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  accept = ".jpg,.jpeg,.png,.pdf",
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "Upload File",
  disabled = false,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files);
    const validFiles: File[] = [];

    selectedFiles.forEach((file) => {
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        setLocalError(`File ${file.name} too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setLocalError(""); // Clear any previous errors
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      onFileChange(validFiles);
    }
  };

  const clearFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileChange(updatedFiles);
  };

  const clearAllFiles = () => {
    setFiles([]);
    onFileChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          accept={accept}
          multiple={true}
        />
        {files.length > 0 && (
          <Button type="button" variant="ghost" size="icon" onClick={clearAllFiles} className="h-8 w-8" title="Clear all files">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => clearFile(index)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm truncate w-40">{file.name}</span>
          </div>
        ))}
      </div>

      {localError && (
        <Alert variant="destructive">
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
