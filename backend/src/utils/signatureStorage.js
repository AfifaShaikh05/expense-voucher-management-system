const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

const BUCKET_NAME = 'signatures';
const STORAGE_PATH_PREFIXES = ['employee/', 'director/'];

const extensionFromFile = (mimetype, originalname) => {
  const originalExt = path.extname(originalname || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png'].includes(originalExt)) {
    return originalExt.slice(1);
  }

  if (mimetype === 'image/png') return 'png';
  return 'jpg';
};

const isStoragePath = (storagePath) => {
  return STORAGE_PATH_PREFIXES.some((prefix) => storagePath.startsWith(prefix));
};

const uploadSignature = async (fileBuffer, mimetype, originalname, voucherId, role) => {
  const ext = extensionFromFile(mimetype, originalname);
  const storagePath = `${role}/${voucherId}-${uuidv4()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimetype,
      upsert: true
    });

  if (error) {
    throw error;
  }

  return storagePath;
};

const getSignedSignatureUrl = async (storagePath, expiresInSeconds = 300) => {
  if (!storagePath) return null;

  if (!isStoragePath(storagePath)) {
    console.warn(`Skipping signature signing for non-Supabase path: ${storagePath}`);
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.warn(`Failed to create signed URL for signature path "${storagePath}": ${error.message}`);
    return null;
  }

  return data.signedUrl;
};

const deleteSignature = async (storagePath) => {
  if (!storagePath || !isStoragePath(storagePath)) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw error;
  }
};

module.exports = {
  uploadSignature,
  getSignedSignatureUrl,
  deleteSignature
};