import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export interface FileMetadata {
  userId: string;
  userName: string;
  originalName: string;
  mimeType: string;
  fileCategory: 'avatar' | 'report' | 'recording' | 'document' | 'general';
  isPublic: boolean;
  sizeBytes: number;
  createdAt: string;
}

export interface StoredFileRecord {
  id: string;
  filename: string;
  sizeBytes: number;
  uploadDate: string;
  metadata: FileMetadata;
}

// Allowed MIME types & max upload size (10 MB)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/json',
  'text/markdown',
  'video/webm',
  'audio/webm',
  'audio/wav',
]);

// MongoDB GridFS Client Singleton
let mongoClient: MongoClient | null = null;
let gridFsBucket: GridFSBucket | null = null;

const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), '.data/gridfs_uploads');

async function getGridFSBucket(): Promise<GridFSBucket | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (gridFsBucket) return gridFsBucket;

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      await mongoClient.connect();
      console.log('MongoDB client connected successfully for GridFS');
    }
    const db = mongoClient.db();
    gridFsBucket = new GridFSBucket(db, { bucketName: 'uploads' });
    return gridFsBucket;
  } catch (err) {
    console.warn('MongoDB GridFS connection failed, using local stream storage:', err);
    return null;
  }
}

// Local stream fallback store when MONGODB_URI is not set
function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

export async function uploadToGridFS(
  filename: string,
  readableStream: Readable,
  metadata: FileMetadata
): Promise<StoredFileRecord> {
  const bucket = await getGridFSBucket();

  if (bucket) {
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata,
      });

      readableStream
        .pipe(uploadStream)
        .on('error', (err) => reject(err))
        .on('finish', () => {
          resolve({
            id: uploadStream.id.toString(),
            filename,
            sizeBytes: metadata.sizeBytes,
            uploadDate: metadata.createdAt,
            metadata,
          });
        });
    });
  }

  // Local durable stream store fallback
  ensureLocalDir();
  const fileId = `gridfs_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  const filePath = path.join(LOCAL_STORAGE_DIR, `${fileId}.bin`);
  const metaPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.meta.json`);

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    readableStream
      .pipe(writeStream)
      .on('error', (err) => reject(err))
      .on('finish', () => {
        fs.writeFileSync(metaPath, JSON.stringify({ filename, metadata }, null, 2), 'utf-8');
        resolve({
          id: fileId,
          filename,
          sizeBytes: metadata.sizeBytes,
          uploadDate: metadata.createdAt,
          metadata,
        });
      });
  });
}

export async function getFileMetadata(fileId: string): Promise<StoredFileRecord | null> {
  const bucket = await getGridFSBucket();

  if (bucket && ObjectId.isValid(fileId)) {
    try {
      const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
      if (files.length > 0) {
        const f = files[0];
        return {
          id: f._id.toString(),
          filename: f.filename,
          sizeBytes: f.length,
          uploadDate: f.uploadDate.toISOString(),
          metadata: (f.metadata as FileMetadata) || ({} as FileMetadata),
        };
      }
    } catch (err) {
      console.warn('GridFS find error:', err);
    }
  }

  // Local fallback lookup
  const metaPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.meta.json`);
  const binPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.bin`);

  if (fs.existsSync(metaPath) && fs.existsSync(binPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const stat = fs.statSync(binPath);
      return {
        id: fileId,
        filename: parsed.filename,
        sizeBytes: stat.size,
        uploadDate: parsed.metadata?.createdAt || new Date().toISOString(),
        metadata: parsed.metadata,
      };
    } catch (e) {
      return null;
    }
  }

  return null;
}

export async function openDownloadStream(fileId: string): Promise<{
  stream: Readable;
  filename: string;
  mimeType: string;
  sizeBytes: number;
} | null> {
  const bucket = await getGridFSBucket();

  if (bucket && ObjectId.isValid(fileId)) {
    const meta = await getFileMetadata(fileId);
    if (meta) {
      const stream = bucket.openDownloadStream(new ObjectId(fileId));
      return {
        stream,
        filename: meta.filename,
        mimeType: meta.metadata?.mimeType || 'application/octet-stream',
        sizeBytes: meta.sizeBytes,
      };
    }
  }

  // Local stream fallback
  const binPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.bin`);
  const metaPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.meta.json`);

  if (fs.existsSync(binPath) && fs.existsSync(metaPath)) {
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const stat = fs.statSync(binPath);
    return {
      stream: fs.createReadStream(binPath),
      filename: parsed.filename,
      mimeType: parsed.metadata?.mimeType || 'application/octet-stream',
      sizeBytes: stat.size,
    };
  }

  return null;
}

export async function deleteFromGridFS(fileId: string): Promise<boolean> {
  const bucket = await getGridFSBucket();

  if (bucket && ObjectId.isValid(fileId)) {
    try {
      await bucket.delete(new ObjectId(fileId));
      return true;
    } catch (err) {
      console.warn('GridFS delete error:', err);
    }
  }

  // Local fallback delete
  const binPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.bin`);
  const metaPath = path.join(LOCAL_STORAGE_DIR, `${fileId}.meta.json`);

  let deleted = false;
  if (fs.existsSync(binPath)) {
    fs.unlinkSync(binPath);
    deleted = true;
  }
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
    deleted = true;
  }

  return deleted;
}

export async function listUserGridFSFiles(userId: string): Promise<StoredFileRecord[]> {
  const bucket = await getGridFSBucket();

  if (bucket) {
    try {
      const files = await bucket.find({ 'metadata.userId': userId }).toArray();
      return files.map((f) => ({
        id: f._id.toString(),
        filename: f.filename,
        sizeBytes: f.length,
        uploadDate: f.uploadDate.toISOString(),
        metadata: (f.metadata as FileMetadata) || ({} as FileMetadata),
      }));
    } catch (err) {
      console.warn('GridFS list files error:', err);
    }
  }

  // Local fallback listing
  ensureLocalDir();
  const results: StoredFileRecord[] = [];
  const files = fs.readdirSync(LOCAL_STORAGE_DIR);

  for (const f of files) {
    if (f.endsWith('.meta.json')) {
      const fileId = f.replace('.meta.json', '');
      const meta = await getFileMetadata(fileId);
      if (meta && meta.metadata?.userId === userId) {
        results.push(meta);
      }
    }
  }

  return results;
}
