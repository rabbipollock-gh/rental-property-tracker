import React, { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { UploadCloud, CheckCircle, AlertCircle, X, Loader } from 'lucide-react';

interface FileUploadProps {
  bucket: string;
  onUploadComplete: (url: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  bucket, 
  onUploadComplete, 
  acceptedTypes = "image/*,application/pdf",
  maxSizeMB = 5 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const processFile = async (file: File) => {
    setError(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (!supabase) throw new Error("Supabase is not configured yet.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Simulate progress for UI UX
      const progressInterval = setInterval(() => {
          setUploadProgress(p => (p < 90 ? p + 10 : p));
      }, 100);

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(100);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete(publicUrlData.publicUrl);
      
      setSuccessVisible(true);
      setTimeout(() => setSuccessVisible(false), 3000);
      
    } catch (err: any) {
      console.error('Upload Error: ', err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  if (successVisible) {
      return (
          <div className="w-full h-32 border-2 border-green-200 bg-green-50 rounded-xl flex flex-col items-center justify-center text-green-600 transition-all">
              <CheckCircle size={32} className="mb-2" />
              <span className="font-medium">Upload Complete!</span>
          </div>
      )
  }

  return (
    <div className="w-full">
      <div 
        className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden
          ${isHovering ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsHovering(false); }}
        onDrop={onDrop}
      >
        <input 
          type="file" 
          accept={acceptedTypes}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          onChange={handleFileInput}
          disabled={isUploading}
        />
        
        {isUploading ? (
            <div className="flex flex-col items-center text-blue-600">
                <Loader className="animate-spin mb-2" size={28} />
                <span className="text-sm font-medium">Uploading... {Math.round(uploadProgress)}%</span>
            </div>
        ) : error ? (
            <div className="flex flex-col items-center text-red-500 px-4 text-center">
                <AlertCircle size={28} className="mb-1" />
                <span className="text-sm font-medium">{error}</span>
                <span className="text-xs text-red-400 mt-1 cursor-pointer underline">Click to try again</span>
            </div>
        ) : (
            <div className="flex flex-col items-center text-gray-500 pointer-events-none">
                <UploadCloud size={32} className="mb-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Click or drag receipt file here</span>
                <span className="text-xs text-gray-400 mt-1">Images or PDF (max {maxSizeMB}MB)</span>
            </div>
        )}
      </div>
    </div>
  );
};
