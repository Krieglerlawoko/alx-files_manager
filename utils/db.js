import { MongoClient } from 'mongodb';

const {
  DB_HOST = 'localhost',
  DB_PORT = 27017,
  DB_DATABASE = 'files_manager'
} = process.env;

const dbUrl = `mongodb://${DB_HOST}:${DB_PORT}`;

/**
 * Manages MongoDB connection and operations
 */
class DatabaseClient {
  constructor() {
    this.db = null;
    this.usersCollection = null;
    this.filesCollection = null;

    this.connectToDatabase();
  }

  /**
   * Establishes connection to MongoDB
   */
  async connectToDatabase() {
    try {
      const client = await MongoClient.connect(dbUrl, { useUnifiedTopology: true });
      this.db = client.db(DB_DATABASE);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
    }
  }

  /**
   * Checks if the database connection is active
   * @return {boolean} true if connected, false otherwise
   */
  isConnectionAlive() {
    return Boolean(this.db);
  }

  /**
   * Gets the number of documents in the users collection
   * @return {Promise<number>} The count of users
   */
  async getUserCount() {
    if (!this.isConnectionAlive()) {
      throw new Error('Database connection is not established');
    }
    return this.usersCollection.countDocuments();
  }

  /**
   * Gets the number of documents in the files collection
   * @return {Promise<number>} The count of files
   */
  async getFileCount() {
    if (!this.isConnectionAlive()) {
      throw new Error('Database connection is not established');
    }
    return this.filesCollection.countDocuments();
  }
}

const dbClient = new DatabaseClient();

export default dbClient;
