import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { promises as fs } from 'fs';
import { join as joinPath } from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import { fileQueue } from '../worker';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (parentId !== 0) {
      const parent = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parent) return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileData = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
      localPath: null,
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = joinPath(folderPath, uuidv4());
      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(localPath, Buffer.from(data, 'base64'));
      fileData.localPath = localPath;
    }

    const result = await dbClient.client.db().collection('files').insertOne(fileData);
    const file = result.ops[0];

    if (type === 'image') {
      fileQueue.add({ userId, fileId: file._id });
    }

    res.status(201).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page) || 0;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const files = await dbClient.client.db().collection('files')
      .aggregate([
        { $match: { parentId: parentId === 0 ? 0 : new ObjectId(parentId), userId: new ObjectId(userId) } },
        { $skip: page * 20 },
        { $limit: 20 },
      ])
      .toArray();

    res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.client.db().collection('files').updateOne({ _id: new ObjectId(fileId) }, { $set: { isPublic: true } });
    file.isPublic = true;

    res.status(200).json(file);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.client.db().collection('files').updateOne({ _id: new ObjectId(fileId) }, { $set: { isPublic: false } });
    file.isPublic = false;

    res.status(200).json(file);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const size = req.query.size || null;

    const file = await dbClient.client.db().collection('files').findOne({ _id: new ObjectId(fileId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    if (file.type === 'folder') return res.status(400).json({ error: 'A folder doesn\'t have content' });

    let localPath = file.localPath;
    if (size) {
      localPath = `${localPath}_${size}`;
    }

    try {
      const data = await fs.readFile(localPath);
      const mimeType = mime.lookup(file.name);
      res.setHeader('Content-Type', mimeType);
      res.status(200).send(data);
    } catch (error) {
      res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
