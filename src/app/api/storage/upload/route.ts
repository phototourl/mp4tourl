import { getDb } from '@/db';
import { userFile } from '@/db/schema';
import {
  MAX_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  VIDEO_STORAGE_FOLDER,
} from '@/lib/constants';
import { ensureAnonymousUser } from '@/lib/ensure-anonymous-user';
import { getSessionFromRequest } from '@/lib/auth-api-session';
import { isVideoFile } from '@/lib/video-upload';
import { uploadFile } from '@/storage';
import { StorageError } from '@/storage/types';
import { randomUUID } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isVideoFolder(folder: string | null): boolean {
  if (!folder) return false;
  return (
    folder === VIDEO_STORAGE_FOLDER ||
    folder === 'videos' ||
    folder.startsWith('video/')
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null;
    const isVideoUpload = isVideoFolder(folder);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (isVideoUpload) {
      if (file.size > MAX_VIDEO_FILE_SIZE) {
        return NextResponse.json(
          {
            error: 'fileTooLarge',
            errorParams: {
              maxMb: Math.round(MAX_VIDEO_FILE_SIZE / (1024 * 1024)),
            },
          },
          { status: 400 }
        );
      }

      if (!isVideoFile(file)) {
        return NextResponse.json(
          {
            error:
              'Unsupported file type. Use MP4, MOV, AVI, WebM, MKV, MPEG, OGG, 3GP, or FLV.',
          },
          { status: 400 }
        );
      }
    } else {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds the server limit' },
          { status: 400 }
        );
      }

      if (!IMAGE_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: 'File type not supported' },
          { status: 400 }
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = isVideoUpload
      ? file.type.startsWith('video/')
        ? file.type
        : 'video/mp4'
      : file.type;

    const result = await uploadFile(
      buffer,
      file.name,
      contentType,
      folder || undefined
    );

    // Persist video uploads for logged-in + anonymous users
    let fileId: string | undefined;
    if (isVideoUpload) {
      const session = await getSessionFromRequest(request);
      const userId =
        session?.user?.id ?? (await ensureAnonymousUser());

      fileId = randomUUID();
      const now = new Date();
      const db = await getDb();

      await db.insert(userFile).values({
        id: fileId,
        userId,
        filename: file.name,
        title: file.name,
        originalUrl: result.url,
        processedUrl: result.url,
        fileSize: file.size,
        mimeType: contentType,
        resourceType: 'video',
        paymentStatus: 'free',
        schemaVersion: 1,
        sourceTemplate: 'home-upload',
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      ...result,
      id: fileId,
    });
  } catch (error) {
    console.error('Error uploading file:', error);

    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Something went wrong while uploading the file' },
      { status: 500 }
    );
  }
}
