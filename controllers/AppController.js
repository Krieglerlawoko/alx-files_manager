/* eslint-disable import/no-named-as-default */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Handles the status check request.
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  }

  /**
   * Handles the statistics request.
   * @param {Request} req - The request object.
   * @param {Response} res - The response object.
   */
  static async getStats(req, res) {
    try {
      const [usersCount, filesCount] = await Promise.all([
        dbClient.nbUsers(),
        dbClient.nbFiles(),
      ]);
      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      res.status(500).json({ error: 'Unable to retrieve statistics' });
    }
  }
}

export default AppController;
