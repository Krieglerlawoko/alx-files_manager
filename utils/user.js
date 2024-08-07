import redisClient from './redis';
import dbClient from './db';

/**
 * User utilities module
 */
const userUtils = {
  /**
   * Retrieves the user ID and Redis key for the token from the request
   * @param {object} request - Express request object
   * @return {object} - Contains userId and Redis key
   */
  async getUserIdAndKey(request) {
    const token = request.header('X-Token');
    const result = { userId: null, key: null };

    if (token) {
      result.key = `auth_${token}`;
      result.userId = await redisClient.get(result.key);
    }

    return result;
  },

  /**
   * Fetches a user document from the database
   * @param {object} query - Query to find the user
   * @return {object} - User document
   */
  async getUser(query) {
    return dbClient.usersCollection.findOne(query);
  }
};

export default userUtils;
