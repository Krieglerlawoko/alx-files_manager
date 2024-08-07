import Bull from 'bull';
import { promises as fs } from 'fs';
import { join as joinPath } from 'path';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  if (!file) throw new Error('File not found');

  const sizes = [500, 250, 100];
  const localPath = file.localPath;

  await Promise.all(sizes.map(async (size) => {
    const thumbnail = await imageThumbnail(localPath, { width: size });
    const thumbnailPath = `${localPath}_${size}`;
    await fs.writeFile(thumbnailPath, thumbnail);
  }));
});

export { fileQueue };
