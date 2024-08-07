import { MongoClient } from 'mongodb';
import envLoader from './env_loader';

/**
 * Represents a MongoDB client.
 */
class DBClient {
  /**
   * Creates a new DBClient instance.
   */
  constructor() {
    envLoader();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect().then(() => {
      console.log('Connected successfully to MongoDB server');
    }).catch((error) => {
      console.error('Failed to connect to MongoDB server:', error);
    });
  }

  /**
   * Checks if this client's connection to the MongoDB server is active.
   * @returns {boolean}
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * Retrieves the number of users in the database.
   * @returns {Promise<number>}
   */
  async nbUsers() {
    try {
      return await this.client.db().collection('users').countDocuments();
    } catch (error) {
      console.error('Error counting documents in users collection:', error);
      throw error;
    }
  }

  /**
   * Retrieves the number of files in the database.
   * @returns {Promise<number>}
   */
  async nbFiles() {
    try {
      return await this.client.db().collection('files').countDocuments();
    } catch (error) {
      console.error('Error counting documents in files collection:', error);
      throw error;
    }
  }

  /**
   * Retrieves a reference to the `users` collection.
   * @returns {Promise<Collection>}
   */
  async usersCollection() {
    try {
      return this.client.db().collection('users');
    } catch (error) {
      console.error('Error getting users collection:', error);
      throw error;
    }
  }

  /**
   * Retrieves a reference to the `files` collection.
   * @returns {Promise<Collection>}
   */
  async filesCollection() {
    try {
      return this.client.db().collection('files');
    } catch (error) {
      console.error('Error getting files collection:', error);
      throw error;
    }
  }
}

export const dbClient = new DBClient();
export default dbClient;
