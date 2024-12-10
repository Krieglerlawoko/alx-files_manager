import { dbClient } from '../utils/db';
import { redisClient } from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';

const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) return res.status(400).send({ error: 'Missing data' });

    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.db.collection('files').findOne({ _id: parentId, userId });
      if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    const file = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(file);
      return res.status(201).send({ id: result.insertedId, ...file });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    file.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(file);

    if (type === 'image') {
      fileQueue.add({ fileId: result.insertedId, userId });
    }

    return res.status(201).send({ id: result.insertedId, ...file });
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query;

    const file = await dbClient.db.collection('files').findOne({ _id: id });
    if (!file) return res.status(404).send({ error: 'Not found' });

    if (file.type === 'folder') return res.status(400).send({ error: "A folder doesn't have content" });

    if (!file.isPublic) {
      const token = req.headers['x-token'];
      const userId = token ? await redisClient.get(`auth_${token}`) : null;

      if (!userId || userId !== file.userId.toString()) {
        return res.status(404).send({ error: 'Not found' });
      }
    }

    const localPath = size ? `${file.localPath}_${size}` : file.localPath;
    if (!fs.existsSync(localPath)) return res.status(404).send({ error: 'Not found' });

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    return res.status(200).sendFile(path.resolve(localPath));
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: id, userId });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: id }, { $set: { isPublic: true } });
    return res.status(200).send({ ...file, isPublic: true });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: id, userId });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: id }, { $set: { isPublic: false } });
    return res.status(200).send({ ...file, isPublic: false });
  }
}

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
});

export default FilesController;
