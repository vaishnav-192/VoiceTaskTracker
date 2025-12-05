'use client';

import { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { Camera, Upload, Trash2, X, Loader2, UserIcon, AlertCircle } from 'lucide-react';
import { uploadProfilePhoto, deleteProfilePhoto } from '@/backend/firebase/storage';
import { useToast } from '@/frontend/components/ui/Toast';
import { getErrorMessage, logError } from '@/backend/errors';

interface ProfilePhotoUploadProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onPhotoUpdated: (newPhotoURL: string | null) => void;
}

export function ProfilePhotoUpload({ user, isOpen, onClose, onPhotoUpdated }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: showSuccess, error: showError } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous error
    setUploadError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file (JPG, PNG, GIF, or WebP)';
      setUploadError(errorMsg);
      showError(errorMsg);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image must be less than 5MB';
      setUploadError(errorMsg);
      showError(errorMsg);
      return;
    }
    
    // Validate empty file
    if (file.size === 0) {
      const errorMsg = 'Selected file is empty';
      setUploadError(errorMsg);
      showError(errorMsg);
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
      showError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const newPhotoURL = await uploadProfilePhoto(selectedFile);
      onPhotoUpdated(newPhotoURL);
      showSuccess('Profile photo updated successfully!');
      handleClose();
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setUploadError(errorMsg);
      logError(error, { context: 'ProfilePhotoUpload.handleUpload', userId: user.uid });
      showError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user.photoURL) return;

    setIsDeleting(true);
    setUploadError(null);
    
    try {
      await deleteProfilePhoto();
      onPhotoUpdated(null);
      showSuccess('Profile photo removed');
      handleClose();
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setUploadError(errorMsg);
      logError(error, { context: 'ProfilePhotoUpload.handleDelete', userId: user.uid });
      showError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const displayPhotoUrl = previewUrl || user.photoURL;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-photo-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 id="profile-photo-title" className="text-lg font-semibold text-gray-900">
            Profile Photo
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Photo Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {displayPhotoUrl ? (
                <img
                  src={displayPhotoUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-gray-100 shadow-lg">
                  <UserIcon className="w-16 h-16 text-white" />
                </div>
              )}
              
              {/* Camera icon overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
                className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Choose new photo"
              >
                <Camera className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            <p className="mt-4 text-sm text-gray-600">
              {user.displayName || user.email}
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload profile photo"
          />

          {/* Actions */}
          <div className="space-y-3">
            {selectedFile ? (
              <>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      Save Photo
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel Selection
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isDeleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  {user.photoURL ? 'Change Photo' : 'Upload Photo'}
                </button>
                
                {user.photoURL && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || isUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        Remove Photo
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Info text */}
          <p className="mt-4 text-xs text-gray-400 text-center">
            Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
          </p>
          
          {/* Error display */}
          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
