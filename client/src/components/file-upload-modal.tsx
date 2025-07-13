import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, File } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
}

export function FileUploadModal({ isOpen, onClose, registration }: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      formData.append("registrationId", registration.id.toString());
      
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const response = await fetch("/api/hackathon/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
      setSelectedFiles(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ["application/zip", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only ZIP, PDF, DOC, DOCX files under 10MB are allowed",
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const dt = new DataTransfer();
      validFiles.forEach(file => dt.items.add(file));
      setSelectedFiles(dt.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleUpload = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Upload Project Files</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? "border-college-blue bg-college-blue/10" 
                : "border-gray-300 hover:border-college-blue"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="text-gray-400 w-6 h-6" />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Support for ZIP, PDF, DOC files up to 10MB
            </p>
            <input
              type="file"
              multiple
              accept=".zip,.pdf,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-input"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              Choose Files
            </Button>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <File className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-college-blue hover:bg-college-dark"
              onClick={handleUpload}
              disabled={!selectedFiles || selectedFiles.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
