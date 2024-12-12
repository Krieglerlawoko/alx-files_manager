import redis from 'redis';
import { promisify } from 'util';

/**
 * RedisService provides methods to interact with the Redis database.
 */
class RedisService {
  constructor() {
    this.client = redis.createClient();

    // Promisify the `get` and `del` methods for async usage
    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client);
    this.asyncSetEx = promisify(this.client.setex).bind(this.client);

    // Event listeners for error and connection events
    this.client.on('error', (err) => {
      console.error(`Error connecting to Redis server: ${err.message}`);
    });

    this.client.on('connect', () => {
      console.info('Successfully connected to Redis server');
    });
  }

  /**
   * Checks if the Redis connection is active.
   * @returns {boolean} True if connected, otherwise false.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Fetches the value associated with a given key from Redis.
   * @param {string} key - The key to look up.
   * @returns {Promise<string|null>} The value for the specified key, or null if not found.
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
   * Stores a key-value pair in Redis with an expiration time.
   * @param {string} key - The key to store.
   * @param {string} value - The value to associate with the key.
   * @param {number} ttl - The time-to-live (TTL) in seconds.
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    try {
      await this.asyncSetEx(key, ttl, value);
    } catch (error) {
      console.error(`Error setting key "${key}" in Redis: ${error.message}`);
    }
  }

  /**
   * Removes a key-value pair from Redis.
   * @param {string} key - The key to remove.
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

// Instantiate and export a singleton instance of RedisService
const redisClient = new RedisService();
export default redisClient;
