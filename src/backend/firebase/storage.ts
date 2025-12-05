import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile, User } from 'firebase/auth';
import { getFirebaseStorage, getFirebaseAuth, isFirebaseReady } from './config';
import { StorageError, ValidationError, getErrorMessage, logError } from '@/backend/errors';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates an image file for upload
 */
function validateImageFile(file: File): void {
  if (!file) {
    throw new ValidationError('No file provided', 'file');
  }
  
  if (!file.type.startsWith('image/')) {
    throw new ValidationError('File must be an image', 'fileType');
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Unsupported image format. Allowed: ${ALLOWED_IMAGE_TYPES.map(t => t.replace('image/', '')).join(', ')}`,
      'fileType'
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `Image must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      'fileSize'
    );
  }
  
  if (file.size === 0) {
    throw new ValidationError('File is empty', 'fileSize');
  }
}

/**
 * Uploads a profile photo for the current user
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  // Check Firebase initialization
  if (!isFirebaseReady()) {
    throw new StorageError(
      'Storage service is not available. Please refresh the page.',
      'storage/not-initialized'
    );
  }
  
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const user = auth.currentUser;
  
  if (!user) {
    throw new StorageError('You must be logged in to upload a profile photo', 'storage/unauthenticated');
  }

  // Validate file
  validateImageFile(file);

  // Create a unique filename
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `profile-photos/${user.uid}/avatar.${fileExtension}`;
  
  // Create storage reference
  const storageRef = ref(storage, fileName);

  try {
    // Upload the file with metadata
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update the user's profile with the new photo URL
    await updateProfile(user, {
      photoURL: downloadURL,
    });

    return downloadURL;
  } catch (error) {
    logError(error, { context: 'uploadProfilePhoto', userId: user.uid, fileName: file.name });
    
    // Translate Firebase Storage errors
    const firebaseError = error as { code?: string };
    if (firebaseError.code) {
      throw new StorageError(getErrorMessage(error), firebaseError.code);
    }
    
    throw new StorageError(
      'Failed to upload profile photo. Please try again.',
      'storage/upload-failed'
    );
  }
}

/**
 * Deletes the current user's profile photo
 */
export async function deleteProfilePhoto(): Promise<void> {
  if (!isFirebaseReady()) {
    throw new StorageError(
      'Storage service is not available.',
      'storage/not-initialized'
    );
  }
  
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const user = auth.currentUser;
  
  if (!user) {
    throw new StorageError('You must be logged in to delete your profile photo', 'storage/unauthenticated');
  }

  // Try to delete the existing photo from storage
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  let deleted = false;
  
  for (const ext of extensions) {
    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}/avatar.${ext}`);
      await deleteObject(storageRef);
      deleted = true;
      break; // Successfully deleted
    } catch (error) {
      const firebaseError = error as { code?: string };
      // File with this extension doesn't exist, try next
      if (firebaseError.code !== 'storage/object-not-found') {
        logError(error, { context: 'deleteProfilePhoto', userId: user.uid, extension: ext });
      }
    }
  }
  
  if (!deleted) {
    // No file was found to delete, but that's okay - just update the profile
    console.log('No existing profile photo found to delete');
  }

  try {
    // Update the user's profile to remove the photo URL
    await updateProfile(user, {
      photoURL: null,
    });
  } catch (error) {
    logError(error, { context: 'deleteProfilePhoto.updateProfile', userId: user.uid });
    throw new StorageError(
      'Failed to update profile. Please try again.',
      'storage/profile-update-failed'
    );
  }
}

/**
 * Gets the current user
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseReady()) {
    return null;
  }
  const auth = getFirebaseAuth();
  return auth.currentUser;
}
