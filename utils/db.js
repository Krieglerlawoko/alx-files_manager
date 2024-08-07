mport { MongoClient } from 'mongodb';
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
    this.connected = false;

    this.client.connect().then(() => {
      console.log('Connected successfully to MongoDB server');
      this.connected = true;
    }).catch((error) => {
      console.error('Failed to connect to MongoDB server:', error);
    });
  }

  /**
   * Checks if this client's connection to the MongoDB server is active.
   * @returns {boolean}
   */
  isAlive() {
    return this.connected;
  }

  /**
   * Retrieves the number of users in the database.
   * @returns {Promise<number>}
   */
  async nbUsers() {
    if (!this.connected) throw new Error('Not connected to MongoDB');
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * Retrieves the number of files in the database.
   * @returns {Promise<number>}
   */
  async nbFiles() {
    if (!this.connected) throw new Error('Not connected to MongoDB');
    return this.client.db().collection('files').countDocuments();
  }

  /**
   * Retrieves a reference to the `users` collection.
   * @returns {Promise<Collection>}
   */
  async usersCollection() {
    if (!this.connected) throw new Error('Not connected to MongoDB');
    return this.client.db().collection('users');
  }

  /**
   * Retrieves a reference to the `files` collection.
   * @returns {Promise<Collection>}
   */
  async filesCollection() {
    if (!this.connected) throw new Error('Not connected to MongoDB');
    return this.client.db().collection('files');
  }
}

export const dbClient = new DBClient();
export default dbClient;
