import { supabase, SUBMISSION_PHOTOS_BUCKET, AVATARS_BUCKET } from './supabase';
import { AppError } from './errors';

const LOG_PREFIX = '[storageService]';

/**
 * Uploads a submission photo to Supabase Storage and returns its public URL.
 * Supports file://, content://, data: URIs and handles blob conversion.
 */
export async function uploadSubmissionPhoto(
  userId: string,
  activityId: string,
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    if (!uri) {
      throw new AppError('VALIDATION', 'No image URI provided for upload');
    }

    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `${userId}/${activityId}/${Date.now()}.${ext}`;

    let body: any;
    if (uri.startsWith('data:') || uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph:')) {
      const response = await fetch(uri);
      body = await response.blob();
    } else {
      body = uri;
    }

    const { data, error } = await supabase.storage
      .from(SUBMISSION_PHOTOS_BUCKET)
      .upload(filename, body, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error(`${LOG_PREFIX} Failed to upload submission photo:`, error);
      throw new AppError('STORAGE', error.message);
    }

    const { data: urlData } = supabase.storage
      .from(SUBMISSION_PHOTOS_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error(`${LOG_PREFIX} Unexpected error uploading photo:`, err);
    throw new AppError('STORAGE', 'Failed to upload submission photo');
  }
}

/**
 * Uploads a user avatar to Supabase Storage and returns its public URL.
 */
export async function uploadAvatarPhoto(
  userId: string,
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    if (!uri) {
      throw new AppError('VALIDATION', 'No avatar URI provided for upload');
    }

    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `${userId}/avatar.${ext}`;

    let body: any;
    if (uri.startsWith('data:') || uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph:')) {
      const response = await fetch(uri);
      body = await response.blob();
    } else {
      body = uri;
    }

    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filename, body, {
        contentType: mimeType,
        upsert: true, // Overwrite previous avatar
      });

    if (error) {
      console.error(`${LOG_PREFIX} Failed to upload avatar:`, error);
      throw new AppError('STORAGE', error.message);
    }

    const { data: urlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error(`${LOG_PREFIX} Unexpected error uploading avatar:`, err);
    throw new AppError('STORAGE', 'Failed to upload avatar image');
  }
}

/**
 * Deletes a submission photo from Supabase Storage given its public URL.
 */
export async function deleteSubmissionPhoto(photoUrl: string): Promise<boolean> {
  try {
    const match = photoUrl.match(new RegExp(`${SUBMISSION_PHOTOS_BUCKET}\\/(.+)$`));
    if (!match || !match[1]) return false;
    const path = decodeURIComponent(match[1]);

    const { error } = await supabase.storage
      .from(SUBMISSION_PHOTOS_BUCKET)
      .remove([path]);

    if (error) {
      console.warn(`${LOG_PREFIX} Failed to delete photo:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Error deleting photo:`, err);
    return false;
  }
}
