/* eslint-disable import/no-named-as-default */
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    const { user } = req;
    const token = uuidv4();
    const tokenKey = `auth_${token}`;
    const userId = user._id.toString();
    const expiration = 24 * 60 * 60; // 24 hours in seconds

    await redisClient.set(tokenKey, userId, expiration);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const tokenKey = `auth_${token}`;

    await redisClient.del(tokenKey);
    return res.status(204).send();
  }
}
