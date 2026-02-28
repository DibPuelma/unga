import { Storage } from '@google-cloud/storage';

const projectId = process.env.GCP_PROJECT_ID;
let clientEmail = process.env.GCP_DEV_CLIENT_EMAIL;
let privateKey = process.env.GCP_DEV_PRIVATE_KEY;
let bucketName = process.env.GCP_DEV_BUCKET_NAME;

if (process.env.NODE_ENV === 'production') {
  clientEmail = process.env.GCP_PROD_CLIENT_EMAIL;
  privateKey = process.env.GCP_PROD_PRIVATE_KEY;
  bucketName = process.env.GCP_PROD_BUCKET_NAME;
}
const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});

export async function generateV4ReadSignedUrl(fileName) {
  // These options will allow temporary read access to the file
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  // Get a v4 signed URL for reading the file
  const [url] = await storage
    .bucket(bucketName)
    .file(fileName)
    .getSignedUrl(options);

  return url;
}

export async function uploadFromMemory(fileName, content) {
  try {
    const response = await storage.bucket(bucketName).file(fileName).save(content);
  } catch (error) {
    return false;
  }

  return true;
}