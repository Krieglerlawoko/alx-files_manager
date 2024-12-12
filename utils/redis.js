import redis from 'redis';
import { promisify } from 'util';

/**
 * RedisClient class for interacting with Redis.
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient(); // Create Redis client

    // Promisify Redis methods for async/await
    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client); // Only use for methods that remain compatible

    // Event listeners for error and connection
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err.message}`);
    });

    this.client.on('connect', () => {
      console.info('Connected to Redis server');
    });
  }

  /**
   * Checks if Redis connection is alive.
   * @returns {boolean} True if connected, otherwise false.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Gets the value associated with a key in Redis.
   * @param {string} key - The key to fetch from Redis.
   * @returns {Promise<string|null>} The value or null if not found.
   */
  async get(key) {
    try {
      return await this.asyncGet(key);
    } catch (error) {
      console.error(`Error fetching key "${key}" from Redis: ${error.message}`);
      return null;
    }
  }

  /**
   * Sets a key-value pair in Redis with an expiration time.
   * Uses callback-based API for compatibility with Redis 3.x.
   * @param {string} key - The key to set in Redis.
   * @param {string|number} value - The value to associate with the key.
   * @param {number} duration - Expiration time in seconds.
   * @returns {Promise<void>}
   */
  set(key, value, duration) {
    this.client.setex(key, duration, value, (err) => {
      if (err) {
        console.error(`Error setting key "${key}" in Redis: ${err.message}`);
      }
    });
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      await this.asyncDel(key);
    } catch (error) {
      console.error(`Error deleting key "${key}" from Redis: ${error.message}`);
    }
  }
}

// Export a singleton instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
