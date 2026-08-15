const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');
const s3Client = require('../config/s3');

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const UPLOAD_EXPIRY_SECONDS = 300; // 5 minutes to complete the upload

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

async function getUploadUrl(userId, fileName, fileType, fileSize) {
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    const err = new Error('File type not allowed');
    err.statusCode = 400;
    throw err;
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const err = new Error('File exceeds maximum size of 25MB');
    err.statusCode = 400;
    throw err;
  }

  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
  const key = 'uploads/' + userId + '/' + randomUUID() + (extension ? '.' + extension : '');

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: UPLOAD_EXPIRY_SECONDS });

  return { uploadUrl, key };
}

async function getDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  return downloadUrl;
}

module.exports = { getUploadUrl, getDownloadUrl };