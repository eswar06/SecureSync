import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Database connection manager for MongoDB
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/securesync-pro';
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        // Modern Mongoose doesn't need these deprecated options
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      });

      this.isConnected = true;
      logger.info('Database connected successfully');

      // Set up connection event listeners
      mongoose.connection.on('error', (error) => {
        logger.error('Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('Database reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Database disconnected');

    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}

// Export singleton instance
export const connectDatabase = async (): Promise<void> => {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.connect();
};

export const disconnectDatabase = async (): Promise<void> => {
  const dbConnection = DatabaseConnection.getInstance();
  await dbConnection.disconnect();
};
