/* eslint-disable import/no-named-as-default */
import { promisify } from 'util';
import { writeFile } from 'fs';
import Queue from 'bull/lib/queue';
import imgThumbnail from 'image-thumbnail';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from './utils/db';
import Mailer from './utils/mailer';

// Promisify fs.writeFile
const writeFileAsync = promisify(writeFile);

// Initialize queues
const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');

/**
 * Creates a thumbnail image with the specified width.
 * @param {String} filePath Path to the original image file.
 * @param {number} width Desired width of the thumbnail.
 * @returns {Promise<void>}
 */
async function createThumbnail(filePath, width) {
  const thumbnailBuffer = await imgThumbnail(filePath, { width });
  console.log(`Creating thumbnail: ${filePath}, width: ${width}`);
  return writeFileAsync(`${filePath}_${width}`, thumbnailBuffer);
}

// File queue processor
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId || !userId) {
    throw new Error('fileId or userId is missing');
  }

  console.log('Processing job for file:', job.data.name || '');
  
  const file = await (await dbClient.filesCollection()).findOne({
    _id: new mongoDBCore.BSON.ObjectId(fileId),
    userId: new mongoDBCore.BSON.ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const thumbnailSizes = [500, 250, 100];
  try {
    await Promise.all(thumbnailSizes.map(size => createThumbnail(file.localPath, size)));
    done();
  } catch (error) {
    done(error);
  }
});

// User queue processor
userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('userId is missing');
  }

  const user = await (await dbClient.usersCollection()).findOne({
    _id: new mongoDBCore.BSON.ObjectId(userId)
  });

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Sending welcome email to ${user.email}`);
  
  try {
    const subject = 'Welcome to ALX-Files_Manager by B3zaleel';
    const htmlContent = `
      <div>
        <h3>Hello ${user.name},</h3>
        Welcome to <a href="https://github.com/B3zaleel/alx-files_manager">
        ALX-Files_Manager</a>, 
        a simple file management API built with Node.js by 
        <a href="https://github.com/B3zaleel">Bezaleel Olakunori</a>. 
        We hope it meets your needs.
      </div>
    `;
    Mailer.sendMail(Mailer.buildMessage(user.email, subject, htmlContent));
    done();
  } catch (error) {
    done(error);
  }
});
