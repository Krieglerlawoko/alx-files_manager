import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { dbClient } from './utils/db';

// Queues
const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

// Process fileQueue for generating thumbnails
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: fileId, userId });
  if (!file) throw new Error('File not found');

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  }

  console.log(`Thumbnails generated for file ${fileId}`);
});

// Process userQueue for sending welcome emails
userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.db.collection('users').findOne({ _id: userId });
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
  // In real-world applications, integrate an email service like SendGrid or Mailgun here.
});
