// Script to upload static assets to R2
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadFile(filePath, key) {
  try {
    const fs = await import('fs');
    const fileContent = fs.readFileSync(filePath);
    
    const command = new PutObjectCommand({
      Bucket: 'event-check-in-storage',
      Key: key,
      Body: fileContent,
      ContentType: getContentType(filePath),
    });
    
    await client.send(command);
    console.log(`Uploaded: ${key}`);
  } catch (error) {
    console.error(`Error uploading ${key}:`, error);
  }
}

function getContentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

// Upload all assets
const assets = [
  'build/client/assets/root-Bhh87Ypv.css',
  'build/client/assets/entry.client-Cwmah2k6.js',
  'build/client/assets/root-BMtNMt8L.js',
  'build/client/assets/chunk-QMGIS6GS-1H9bd84e.js',
  'build/client/assets/events-Dify8LaL.js',
  'build/client/assets/checkin-DqTSWrvH.js',
  'build/client/assets/login-CQpGRapz.js',
  'build/client/assets/stats-CI-2jgMQ.js',
  'build/client/assets/home-DigGk6KG.js',
  'build/client/assets/AuthContext-BO7CK9q6.js',
  'build/client/assets/ProtectedRoute-ztqUlo1h.js',
  'build/client/assets/StatsPanel-B22oWRvG.js',
  'build/client/favicon.ico'
];

async function uploadAll() {
  for (const asset of assets) {
    await uploadFile(asset, asset.replace('build/client/', ''));
  }
  console.log('All assets uploaded successfully!');
}

uploadAll().catch(console.error);
