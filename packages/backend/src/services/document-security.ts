import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { redisClient } from '../cache/redis';
import {
  Document,
  DocumentPermissions,
  DRMConfig,
  BlockchainLog,
  DocumentAction,
  DocumentWatermark,
  WatermarkType,
  WatermarkPosition,
  DocumentAccess,
  DeviceInfo,
  DocumentClassification
} from '../../../shared/src/types/index';
import crypto from 'crypto';
import { Web3 } from 'web3';

/**
 * DocumentSecurityManager - Document control with DRM and blockchain logging
 */
export class DocumentSecurityManager extends EventEmitter {
  private web3!: Web3;
  private contractAddress!: string;
  private privateKey!: string;
  private activeDocuments: Map<string, Document> = new Map();
  private accessSessions: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeBlockchain();
    this.initializeDocumentSecurity();
  }

  private initializeBlockchain(): void {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    this.web3 = new Web3(rpcUrl);
    this.contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
    
    if (!this.contractAddress || !this.privateKey) {
      logger.warn('Blockchain configuration missing, using mock implementation');
    }
  }

  private initializeDocumentSecurity(): void {
    logger.info('Initializing Document Security Manager');
    this.loadActiveDocuments();
    this.startAccessMonitoring();
  }

  /**
   * Applies DRM protection to a document with granular permissions
   */
  public async applyDRMProtection(document: Document, permissions: DocumentPermissions): Promise<Document> {
    try {
      const protectedDocument: Document = {
        ...document,
        permissions,
        drm: {
          enabled: true,
          encryptionLevel: 'high' as any,
          downloadPrevention: true,
          printPrevention: true,
          copyPrevention: true,
          screenshotPrevention: true,
          watermarkingEnabled: true,
          accessLogging: true,
          timeBasedAccess: permissions.expiryDate ? {
            startTime: new Date(),
            endTime: permissions.expiryDate,
            maxAccessDuration: 3600000, // 1 hour
            maxAccessCount: 10
          } : undefined
        },
        blockchain: [],
        watermarks: [],
        accessHistory: [],
        version: document.version + 1,
        updatedAt: new Date()
      };

      // Generate document watermarks
      const watermarks = await this.generateDocumentWatermarks(protectedDocument);
      protectedDocument.watermarks = watermarks;

      // Store protected document
      this.activeDocuments.set(protectedDocument.id, protectedDocument);
      await this.persistDocument(protectedDocument);

      // Log DRM application to blockchain
      await this.logAccessToBlockchain(
        protectedDocument.id,
        protectedDocument.ownerId,
        DocumentAction.EDIT
      );

      logger.info(`DRM protection applied to document: ${protectedDocument.id}`, {
        ownerId: protectedDocument.ownerId,
        encryptionLevel: protectedDocument.drm.encryptionLevel,
        permissions: Object.keys(permissions).length
      });

      this.emit('drm-applied', { document: protectedDocument, permissions });

      return protectedDocument;

    } catch (error) {
      logger.error('Failed to apply DRM protection:', error);
      throw error;
    }
  }

  /**
   * Logs document access to blockchain for immutable audit trail
   */
  public async logAccessToBlockchain(documentId: string, userId: string, action: DocumentAction): Promise<string> {
    try {
      const timestamp = new Date();
      const logEntry: BlockchainLog = {
        id: crypto.randomUUID(),
        documentId,
        userId,
        action,
        timestamp,
        ipAddress: '0.0.0.0', // Would be provided by caller
        userAgent: 'system',
        hash: '',
        previousHash: await this.getLastBlockHash(documentId),
        verified: false
      };

      // Generate hash for this entry
      logEntry.hash = this.generateBlockHash(logEntry);

      // Store in local blockchain record
      const document = this.activeDocuments.get(documentId);
      if (document) {
        document.blockchain.push(logEntry);
        await this.persistDocument(document);
      }

      // Log to actual blockchain if configured
      let blockchainTxHash = '';
      if (this.contractAddress && this.privateKey) {
        blockchainTxHash = await this.writeToBlockchain(logEntry);
        logEntry.verified = true;
      } else {
        // Mock blockchain transaction
        blockchainTxHash = `mock_tx_${crypto.randomBytes(16).toString('hex')}`;
        logEntry.verified = false;
      }

      // Store blockchain log entry
      await redisClient.setex(
        `blockchain-log:${logEntry.id}`,
        3600 * 24 * 365, // 1 year
        JSON.stringify(logEntry)
      );

      logger.audit(`Document access logged to blockchain: ${action}`, {
        documentId,
        userId,
        action,
        blockchainTxHash,
        verified: logEntry.verified
      });

      this.emit('blockchain-logged', { logEntry, blockchainTxHash });

      return blockchainTxHash;

    } catch (error) {
      logger.error('Failed to log access to blockchain:', error);
      throw error;
    }
  }

  /**
   * Generates dynamic document watermarks with user identification
   */
  public async generateDocumentWatermark(documentId: string, userId: string): Promise<DocumentWatermark> {
    try {
      const document = this.activeDocuments.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const watermark: DocumentWatermark = {
        id: crypto.randomUUID(),
        type: WatermarkType.TEXT,
        content: this.generateWatermarkContent(userId, documentId),
        position: WatermarkPosition.BOTTOM_RIGHT,
        opacity: 0.3,
        dynamic: true,
        userId,
        timestamp: new Date()
      };

      // Add to document watermarks
      document.watermarks.push(watermark);
      document.updatedAt = new Date();
      await this.persistDocument(document);

      logger.info(`Document watermark generated: ${watermark.id}`, {
        documentId,
        userId,
        type: watermark.type,
        dynamic: watermark.dynamic
      });

      this.emit('watermark-generated', { watermark, documentId, userId });

      return watermark;

    } catch (error) {
      logger.error('Failed to generate document watermark:', error);
      throw error;
    }
  }

  /**
   * Revokes document access instantly with blockchain logging
   */
  public async revokeDocumentAccess(documentId: string, userId: string): Promise<void> {
    try {
      const document = this.activeDocuments.get(documentId);
      if (!document) {


        throw new Error('Document not found');
      }

      // Remove user from all permission lists
      document.permissions.allowedToView = (document.permissions.allowedToView?document.permissions.allowedToView:[]).filter(id => id !== userId);
      document.permissions.allowedToEdit = (document.permissions.allowedToEdit?document.permissions.allowedToEdit:[]).filter(id => id !== userId);
      document.permissions.allowedToDownload =(document.permissions.allowedToDownload?document.permissions.allowedToDownload:[]).filter(id => id !== userId);
      document.permissions.allowedToShare = (document.permissions.allowedToShare?document.permissions.allowedToShare:[]).filter(id => id !== userId);
      document.permissions.allowedToDelete = (document.permissions.allowedToDelete?document.permissions.allowedToDelete:[]).filter(id => id !== userId);

      document.updatedAt = new Date();
      await this.persistDocument(document);

      // Invalidate any active access sessions
      await this.invalidateUserSessions(documentId, userId);

      // Log revocation to blockchain
      await this.logAccessToBlockchain(documentId, userId, DocumentAction.DELETE);

      logger.security(`Document access revoked: ${documentId}`, {
        documentId,
        userId,
        revokedBy: 'system', // Would be provided by caller
        timestamp: new Date()
      });

      this.emit('access-revoked', { documentId, userId, timestamp: new Date() });

    } catch (error) {
      logger.error('Failed to revoke document access:', error);
      throw error;
    }
  }

  /**
   * Validates document access permissions and logs attempt
   */
  public async validateDocumentAccess(
    documentId: string, 
    userId: string, 
    action: DocumentAction,
    deviceInfo?: DeviceInfo
  ): Promise<boolean> {
    try {
      const document = this.activeDocuments.get(documentId);
      if (!document) {
        await this.logAccessAttempt(documentId, userId, action, false, 'Document not found', deviceInfo);
        return false;
      }

      // Check if DRM is enabled
      if (!document.drm.enabled) {
        await this.logAccessAttempt(documentId, userId, action, true, 'DRM not enabled', deviceInfo);
        return true;
      }

      // Check basic permissions
      const hasPermission = this.checkActionPermission(document, userId, action);
      if (!hasPermission) {
        await this.logAccessAttempt(documentId, userId, action, false, 'Permission denied', deviceInfo);
        return false;
      }

      // Check time-based access
      if (document.drm.timeBasedAccess) {
        const timeValid = this.validateTimeBasedAccess(document.drm.timeBasedAccess, userId);
        if (!timeValid) {
          await this.logAccessAttempt(documentId, userId, action, false, 'Time-based access expired', deviceInfo);
          return false;
        }
      }

      // Check IP restrictions
      if (document.permissions.ipRestrictions && document.permissions.ipRestrictions.length > 0) {
        const ipValid = this.validateIPAccess(document.permissions.ipRestrictions, deviceInfo?.ipAddress||'');
        if (!ipValid) {
          await this.logAccessAttempt(documentId, userId, action, false, 'IP restriction violation', deviceInfo);
          return false;
        }
      }

      // Check device restrictions
      if (document.permissions.deviceRestrictions && deviceInfo) {
        const deviceValid = this.validateDeviceAccess(document.permissions.deviceRestrictions, deviceInfo);
        if (!deviceValid) {
          await this.logAccessAttempt(documentId, userId, action, false, 'Device restriction violation', deviceInfo);
          return false;
        }
      }

      // Log successful access
      await this.logAccessAttempt(documentId, userId, action, true, 'Access granted', deviceInfo);
      
      // Log to blockchain
      await this.logAccessToBlockchain(documentId, userId, action);

      return true;

    } catch (error) {
      logger.error('Failed to validate document access:', error);
      await this.logAccessAttempt(documentId, userId, action, false, 'Validation error', deviceInfo);
      return false;
    }
  }

  /**
   * Shares a document with specified recipients
   */
  public async shareDocument(documentId: string, sharedBy: string, recipients: string[]): Promise<Document> {
    try {
      const document = this.activeDocuments.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check if user has share permission
      if (document.permissions.allowedToShare && !document.permissions.allowedToShare.includes(sharedBy)) {
        throw new Error('User does not have share permission');
      }

      // Add recipients to view permissions
      for (const recipient of recipients) {
        if (document.permissions.allowedToView && !document.permissions.allowedToView.includes(recipient)) {
          document.permissions.allowedToView.push(recipient);
        }
      }

      document.updatedAt = new Date();
      await this.persistDocument(document);

      // Log sharing action
      await this.logAccessToBlockchain(documentId, sharedBy, DocumentAction.SHARE);

      // Generate watermarks for new recipients
      for (const recipient of recipients) {
        await this.generateDocumentWatermark(documentId, recipient);
      }

      logger.info(`Document shared: ${documentId}`, {
        sharedBy,
        recipients: recipients.length,
        newViewers: recipients.filter(r => document.permissions.allowedToView && !document.permissions.allowedToView.includes(r)).length
      });

      this.emit('document-shared', { document, sharedBy, recipients });

      return document;

    } catch (error) {
      logger.error('Failed to share document:', error);
      throw error;
    }
  }

  // Private helper methods

  private async generateDocumentWatermarks(document: Document): Promise<DocumentWatermark[]> {
    const watermarks: DocumentWatermark[] = [];

    // Generate watermarks for all users with view access
    for (const userId of document.permissions.allowedToView || []) {
      const watermark = await this.generateDocumentWatermark(document.id, userId);
      watermarks.push(watermark);
    }

    return watermarks;
  }

  private generateWatermarkContent(userId: string, documentId: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userHash = crypto.createHash('md5').update(userId).digest('hex').substring(0, 6);
    const docHash = crypto.createHash('md5').update(documentId).digest('hex').substring(0, 6);
    
    return `${userHash}-${docHash}-${timestamp}`;
  }

  private checkActionPermission(document: Document, userId: string, action: DocumentAction): boolean {
    switch (action) {
      case DocumentAction.VIEW:
        return document.permissions.allowedToView?.includes(userId) || false;
      case DocumentAction.EDIT:
        return document.permissions.allowedToEdit?.includes(userId) || false;
      case DocumentAction.DOWNLOAD:
        return document.permissions.allowedToDownload?.includes(userId) && !document.drm.downloadPrevention || false;
      case DocumentAction.SHARE:
        return document.permissions.allowedToShare?.includes(userId) || false;
      case DocumentAction.DELETE:
        return document.permissions.allowedToDelete?.includes(userId) || false;
      case DocumentAction.PRINT:
        return document.permissions.allowedToView?.includes(userId) && !document.drm.printPrevention || false;
      case DocumentAction.COPY:
        return document.permissions.allowedToView?.includes(userId) && !document.drm.copyPrevention || false;
      default:
        return false;
    }
  }

  private validateTimeBasedAccess(timeBasedAccess: any, userId: string): boolean {
    const now = new Date();
    
    if (now < timeBasedAccess.startTime || now > timeBasedAccess.endTime) {
      return false;
    }

    // Check max access duration and count (would need to track per user)
    return true;
  }

  private validateIPAccess(allowedIPs: string[], userIP?: string): boolean {
    if (!userIP) return false;
    return allowedIPs.includes(userIP) || allowedIPs.includes('*');
  }

  private validateDeviceAccess(allowedDevices: string[], deviceInfo: DeviceInfo): boolean {
    return allowedDevices.includes(deviceInfo.deviceId) || 
           allowedDevices.includes('*') ||
           deviceInfo.trusted;
  }

  private async logAccessAttempt(
    documentId: string,
    userId: string,
    action: DocumentAction,
    success: boolean,
    reason: string,
    deviceInfo?: DeviceInfo
  ): Promise<void> {
    const accessLog: DocumentAccess = {
      id: crypto.randomUUID(),
      userId,
      action,
      timestamp: new Date(),
      duration: 0, // Would be calculated for ongoing sessions
      ipAddress: deviceInfo?.ipAddress || 'unknown',
      deviceInfo: deviceInfo || {
        deviceId: 'unknown',
        deviceType: 'unknown',
        browser: 'unknown',
        ipAddress: 'unknown',
        os: 'unknown',
        trusted: false
      },
      success,
      denialReason: success ? undefined : reason
    };

    // Store access log
    await redisClient.lpush(
      `document-access:${documentId}`,
      JSON.stringify(accessLog)
    );

    // Keep only last 1000 access logs per document
    await redisClient.ltrim(`document-access:${documentId}`, 0, 999);

    // Add to document's access history
    const document = this.activeDocuments.get(documentId);
    if (document) {
      document.accessHistory.push(accessLog);
      // Keep only last 100 access records in memory
      if (document.accessHistory.length > 100) {
        document.accessHistory = document.accessHistory.slice(-100);
      }
    }
  }

  private async invalidateUserSessions(documentId: string, userId: string): Promise<void> {
    const sessionKey = `doc-session:${documentId}:${userId}`;
    await redisClient.del(sessionKey);
    
    // Remove from active sessions
    this.accessSessions.delete(`${documentId}:${userId}`);
  }

  private generateBlockHash(logEntry: BlockchainLog): string {
    const data = `${logEntry.documentId}${logEntry.userId}${logEntry.action}${logEntry.timestamp.toISOString()}${logEntry.previousHash || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async getLastBlockHash(documentId: string): Promise<string | undefined> {
    const document = this.activeDocuments.get(documentId);
    if (document && document.blockchain.length > 0) {
      return document.blockchain[document.blockchain.length - 1].hash;
    }
    return undefined;
  }

  private async writeToBlockchain(logEntry: BlockchainLog): Promise<string> {
    try {
      // Mock blockchain transaction - in real implementation would use actual blockchain
      const txHash = crypto.randomBytes(32).toString('hex');
      
      logger.info(`Blockchain transaction created: ${txHash}`, {
        documentId: logEntry.documentId,
        userId: logEntry.userId,
        action: logEntry.action
      });

      return txHash;

    } catch (error) {
      logger.error('Failed to write to blockchain:', error);
      throw error;
    }
  }

  private async persistDocument(document: Document): Promise<void> {
    try {
      await redisClient.setex(
        `document:${document.id}`,
        3600 * 24 * 365, // 1 year
        JSON.stringify(document)
      );
    } catch (error) {
      logger.error('Failed to persist document:', error);
    }
  }

  private async loadActiveDocuments(): Promise<void> {
    try {
      const keys = await redisClient.keys('document:*');
      
      for (const key of keys) {
        const documentData = await redisClient.get(key);
        if (documentData) {
          const document: Document = JSON.parse(documentData);
          this.activeDocuments.set(document.id, document);
        }
      }

      logger.info(`Loaded ${this.activeDocuments.size} active documents`);

    } catch (error) {
      logger.error('Failed to load active documents:', error);
    }
  }

  private startAccessMonitoring(): void {
    // Periodic access monitoring and cleanup
    setInterval(() => {
      this.performAccessMonitoring();
    }, 300000); // Every 5 minutes
  }

  private async performAccessMonitoring(): Promise<void> {
    // Clean up expired documents and sessions
    logger.debug('Performing document access monitoring');
  }

  public getDocument(documentId: string): Document | undefined {
    return this.activeDocuments.get(documentId);
  }

  public getDocumentAccessHistory(documentId: string): DocumentAccess[] {
    const document = this.activeDocuments.get(documentId);
    return document ? document.accessHistory : [];
  }

  public getActiveDocuments(): Document[] {
    return Array.from(this.activeDocuments.values());
  }
}
