import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile, User } from 'firebase/auth';
import { getFirebaseStorage, getFirebaseAuth } from './config';

/**
 * Uploads a profile photo for the current user
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to upload profile photo');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Image must be less than 5MB');
  }

  // Create a unique filename
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `profile-photos/${user.uid}/avatar.${fileExtension}`;
  
  // Create storage reference
  const storageRef = ref(storage, fileName);

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: user.uid,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  // Update the user's profile with the new photo URL
  await updateProfile(user, {
    photoURL: downloadURL,
  });

  return downloadURL;
}

/**
 * Deletes the current user's profile photo
 */
export async function deleteProfilePhoto(): Promise<void> {
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be logged in to delete profile photo');
  }

  // Try to delete the existing photo from storage
  try {
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    for (const ext of extensions) {
      const storageRef = ref(storage, `profile-photos/${user.uid}/avatar.${ext}`);
      try {
        await deleteObject(storageRef);
        break; // Successfully deleted
      } catch {
        // File with this extension doesn't exist, try next
      }
    }
  } catch (error) {
    console.warn('Could not delete old profile photo:', error);
  }

  // Update the user's profile to remove the photo URL
  await updateProfile(user, {
    photoURL: null,
  });
}

/**
 * Gets the current user
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}
