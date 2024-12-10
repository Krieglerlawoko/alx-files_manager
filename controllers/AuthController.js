import { redisClient } from '../utils/redis';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send({ error: 'Unauthorized' });

    const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8').split(':');
    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
