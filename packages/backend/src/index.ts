console.log("🚀 Starting backend index.ts");
console.log("🚀 Second backend index.ts");

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './database/connection';
import { connectRedis } from './cache/redis';
import { initializeWebSocket } from './websocket/socket-handler';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { meetingRouter } from './routes/meetings';
import { spaceRouter } from './routes/spaces';
import { documentRouter } from './routes/documents';
import { securityRouter } from './routes/security';
import { transcriptionRouter } from './routes/transcription';
import { reminderRouter } from './routes/reminders';
import { aiRouter } from './routes/ai';
import { industryRouter } from './routes/industry';
import { setupSwagger } from './utils/swagger';
import { RecordingPreventionEngine } from './services/recording-prevention';
import { TranscriptionEngine } from './services/transcription';
import { AIAdaptationEngine } from './services/ai-adaptation';
import { DocumentSecurityManager } from './services/document-security';
import { PrivateVoiceManager } from './services/private-voice';
import { SmartReminderSystem } from './services/smart-reminders';
import { SpacesThreadingManager } from './services/spaces-threading';




// Load environment variables
dotenv.config();

class SecureSyncProServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private recordingPrevention!: RecordingPreventionEngine;
  private transcriptionEngine!: TranscriptionEngine;
  private aiEngine!: AIAdaptationEngine;
  private documentSecurity!: DocumentSecurityManager;
  private privateVoice!: PrivateVoiceManager;
  private reminderSystem!: SmartReminderSystem;
  private spacesThreading!: SpacesThreadingManager;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private initializeServices(): void {
    this.recordingPrevention = new RecordingPreventionEngine();
    this.transcriptionEngine = new TranscriptionEngine();
    this.aiEngine = new AIAdaptationEngine();
    this.documentSecurity = new DocumentSecurityManager();
    this.privateVoice = new PrivateVoiceManager();
    this.reminderSystem = new SmartReminderSystem();
    this.spacesThreading = new SpacesThreadingManager();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:",process.env.FRONTEND_URL || "http://localhost:3000","http://127.0.0.1:3000"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [process.env.FRONTEND_URL || "http://localhost:3000","http://127.0.0.1:3000"],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // General middleware
    this.app.use(compression());
    this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/users', userRouter);
    this.app.use('/api/meetings', meetingRouter);
    this.app.use('/api/spaces', spaceRouter);
    this.app.use('/api/documents', documentRouter);
    this.app.use('/api/security', securityRouter);
    this.app.use('/api/transcription', transcriptionRouter);
    this.app.use('/api/reminders', reminderRouter);
    this.app.use('/api/ai', aiRouter);
    this.app.use('/api/industry', industryRouter);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API documentation
    setupSwagger(this.app);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found',
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    this.server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      try {
        await connectDatabase();
        logger.info("Database connected successfully");
      } catch (err) {
        logger.error("Database connection failed", err);
        process.exit(1);
      }
      // Initialize Redis connection
      try {
        await connectRedis();
        logger.info("Redis connected successfully");
      } catch (err) {
        logger.error("Redis connection failed", err);
        // maybe allow server to still start:
        // return; or continue without Redis
      }

      // Initialize WebSocket handlers
      initializeWebSocket(this.io, {
        recordingPrevention: this.recordingPrevention,
        transcriptionEngine: this.transcriptionEngine,
        aiEngine: this.aiEngine,
        documentSecurity: this.documentSecurity,
        privateVoice: this.privateVoice,
        reminderSystem: this.reminderSystem,
        spacesThreading: this.spacesThreading
      });
      logger.info('WebSocket handlers initialized');

      const port = process.env.PORT || 5000;
      
      process.on("exit", (code) => {
        console.log("⚡ Process exit event fired with code:", code);
      });
      this.server.listen(port, () => {
        logger.info(`🚀 SecureSync Pro Server running on port ${port}`);
        logger.info(`📱 WebSocket server ready for connections`);
        logger.info(`📚 API Documentation available at http://localhost:${port}/api-docs`);
        logger.info(`💚 Health check available at http://localhost:${port}/health`);
        
        if (process.env.NODE_ENV === 'development') {
          logger.info(`🌐 Frontend should connect to: http://localhost:${port}`);
        }
      });

    } catch (error) {
      // logger.error('Failed to start server:', error);
      // console.log('Failed to start server:', error);
      // process.exit(1);
      console.error('❌ Failed to start server:', error);
      // give logger/console time to flush
      setTimeout(() => process.exit(1), 2000);
    }
  }
}

// Start the server
const server = new SecureSyncProServer();
server.start().catch(error => {
  console.log('Server startup failed:', error);
  logger.error('Server startup failed:', error);
  setTimeout(() => process.exit(1), 2000);
});


export { SecureSyncProServer };
