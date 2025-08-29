import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useAppDispatch, useAppSelector } from './redux';
import { addNotification } from '../store/slices/notificationsSlice';
import {
  Document,
  DocumentPermissions,
  WatermarkConfig,
  AccessLogEntry,
  DRMProtectedDocument,
  WatermarkPosition
} from '../../../shared/src/types/index';

interface DocumentSecurityHook {
  // Document management
  documents: Document[];
  protectedDocuments: DRMProtectedDocument[];
  accessLogs: AccessLogEntry[];
  
  // DRM functions
  protectDocument: (document: Document, permissions: DocumentPermissions) => Promise<string | null>;
  updateDocumentPermissions: (documentId: string, permissions: DocumentPermissions) => Promise<boolean>;
  revokeAccess: (documentId: string, userId?: string) => Promise<boolean>;
  
  // Watermarking
  applyWatermark: (documentId: string, config: WatermarkConfig) => Promise<boolean>;
  removeWatermark: (documentId: string) => Promise<boolean>;
  
  // Access control
  requestAccess: (documentId: string, reason?: string) => Promise<boolean>;
  grantAccess: (documentId: string, userId: string, permissions: DocumentPermissions) => Promise<boolean>;
  checkAccess: (documentId: string) => Promise<DocumentPermissions | null>;
  
  // Blockchain logging
  logAccess: (documentId: string, action: string, metadata?: any) => Promise<string | null>;
  getBlockchainLogs: (documentId: string) => Promise<AccessLogEntry[]>;
  verifyIntegrity: (documentId: string) => Promise<boolean>;
  
  // Time-based controls
  setExpirationTime: (documentId: string, expirationTime: Date) => Promise<boolean>;
  extendAccess: (documentId: string, additionalTime: number) => Promise<boolean>;
  
  // Monitoring
  enableRealTimeMonitoring: (documentId: string) => Promise<boolean>;
  getSecurityEvents: (documentId: string) => Promise<any[]>;
  
  // Utility functions
  downloadSecureDocument: (documentId: string) => Promise<Blob | null>;
  previewDocument: (documentId: string) => Promise<string | null>;
  getDocumentMetadata: (documentId: string) => Promise<any>;
}

export const useDocumentSecurity = (): DocumentSecurityHook => {
  const dispatch = useAppDispatch();
  const { socket, emit, on, off } = useSocket();
  const { user } = useAppSelector((state) => state.auth);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [protectedDocuments, setProtectedDocuments] = useState<DRMProtectedDocument[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);

  const blockchainInterface = useRef<any>(null);
  const securityMonitors = useRef<Map<string, any>>(new Map());

  // Initialize document security system
  useEffect(() => {
    if (user?.id && socket) {
      initializeDocumentSecurity();
      loadUserDocuments();
    }

    return () => {
      cleanupSecurityMonitors();
    };
  }, [user?.id, socket]);

  const initializeDocumentSecurity = useCallback(async () => {
    try {
      // Initialize blockchain interface
      blockchainInterface.current = await initializeBlockchain();
      
      emit('initialize-document-security', {
        userId: user?.id,
        capabilities: {
          drm: true,
          watermarking: true,
          blockchain: !!blockchainInterface.current,
          realTimeMonitoring: true
        }
      });
    } catch (error) {
      console.error('Failed to initialize document security:', error);
    }
  }, [user?.id, emit]);

  const initializeBlockchain = async () => {
    // Mock blockchain interface - in production, this would connect to actual blockchain
    return {
      logTransaction: async (data: any) => {
        const hash = await generateHash(data);
        return hash;
      },
      verifyTransaction: async (hash: string, data: any) => {
        const expectedHash = await generateHash(data);
        return hash === expectedHash;
      },
      getTransactionHistory: async (documentId: string) => {
        // Mock implementation
        return [];
      }
    };
  };

  const generateHash = async (data: any): Promise<string> => {
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataArray);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const loadUserDocuments = useCallback(async () => {
    try {
      emit('get-user-documents', { userId: user?.id });
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [user?.id, emit]);

  const protectDocument = useCallback(async (
    document: Document, 
    permissions: DocumentPermissions
  ): Promise<string | null> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate DRM protection key
      const protectionKey = await generateProtectionKey();
      
      // Create watermark configuration
      const watermarkConfig: WatermarkConfig = {
        text: `${user.name} • ${new Date().toISOString()}`,
        opacity: 0.3,
        position: WatermarkPosition.CENTER,
        fontSize: 12,
        color: '#666666',
        rotation: 45
      };

      const protectedDoc: DRMProtectedDocument = {
        id: `protected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalDocumentId: document.id,
        protectionKey,
        permissions,
        watermarkConfig,
        createdBy: user.id,
        createdAt: new Date(),
        isActive: true,
        accessCount: 0,
        lastAccessedAt: null,
        expirationTime: permissions.expirationTime,
        allowedDownloads: permissions.allowedDownloads || 0,
        encryptionAlgorithm: 'AES-256-GCM',
        blockchainHash: ''
      };

      // Log to blockchain
      const blockchainHash = await logAccess(document.id, 'document_protected', {
        permissions,
        protectionKey: protectionKey.substring(0, 8) + '...' // Partial key for logging
      });

      if (blockchainHash) {
        protectedDoc.blockchainHash = blockchainHash;
      }

      emit('protect-document', {
        document,
        protectedDocument: protectedDoc
      });

      // Optimistically add to state
      setProtectedDocuments(prev => [...prev, protectedDoc]);

      dispatch(addNotification({
        type: 'success',
        title: 'Document Protected',
        message: `Document "${document.name}" is now DRM protected`
      }));

      return protectedDoc.id;
    } catch (error) {
      console.error('Failed to protect document:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Protection Failed',
        message: 'Failed to apply DRM protection to document'
      }));
      return null;
    }
  }, [user, emit, dispatch]);

  const generateProtectionKey = async (): Promise<string> => {
    const keyData = new Uint8Array(32);
    crypto.getRandomValues(keyData);
    return Array.from(keyData, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const updateDocumentPermissions = useCallback(async (
    documentId: string, 
    permissions: DocumentPermissions
  ): Promise<boolean> => {
    try {
      emit('update-document-permissions', {
        documentId,
        permissions,
        updatedBy: user?.id
      });

      // Log permission change to blockchain
      await logAccess(documentId, 'permissions_updated', { permissions });

      // Update local state
      setProtectedDocuments(prev => prev.map(doc => 
        doc.id === documentId || doc.originalDocumentId === documentId 
          ? { ...doc, permissions } 
          : doc
      ));

      dispatch(addNotification({
        type: 'success',
        title: 'Permissions Updated',
        message: 'Document permissions have been updated'
      }));

      return true;
    } catch (error) {
      console.error('Failed to update permissions:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const revokeAccess = useCallback(async (documentId: string, userId?: string): Promise<boolean> => {
    try {
      emit('revoke-document-access', {
        documentId,
        userId, // If specified, revoke for specific user; otherwise revoke all
        revokedBy: user?.id
      });

      // Log revocation to blockchain
      await logAccess(documentId, 'access_revoked', { 
        targetUserId: userId,
        revokedBy: user?.id 
      });

      if (!userId) {
        // Revoke all access - deactivate protection
        setProtectedDocuments(prev => prev.map(doc => 
          doc.id === documentId || doc.originalDocumentId === documentId 
            ? { ...doc, isActive: false } 
            : doc
        ));
      }

      dispatch(addNotification({
        type: 'warning',
        title: 'Access Revoked',
        message: userId 
          ? `Access revoked for user ${userId}` 
          : 'All access to document has been revoked'
      }));

      return true;
    } catch (error) {
      console.error('Failed to revoke access:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const applyWatermark = useCallback(async (
    documentId: string, 
    config: WatermarkConfig
  ): Promise<boolean> => {
    try {
      emit('apply-document-watermark', {
        documentId,
        watermarkConfig: config,
        appliedBy: user?.id
      });

      // Log watermark application
      await logAccess(documentId, 'watermark_applied', { config });

      dispatch(addNotification({
        type: 'success',
        title: 'Watermark Applied',
        message: 'Document watermark has been applied'
      }));

      return true;
    } catch (error) {
      console.error('Failed to apply watermark:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const removeWatermark = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      emit('remove-document-watermark', {
        documentId,
        removedBy: user?.id
      });

      // Log watermark removal
      await logAccess(documentId, 'watermark_removed', {});

      dispatch(addNotification({
        type: 'info',
        title: 'Watermark Removed',
        message: 'Document watermark has been removed'
      }));

      return true;
    } catch (error) {
      console.error('Failed to remove watermark:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const requestAccess = useCallback(async (documentId: string, reason?: string): Promise<boolean> => {
    try {
      emit('request-document-access', {
        documentId,
        requestedBy: user?.id,
        reason,
        requestTime: new Date()
      });

      // Log access request
      await logAccess(documentId, 'access_requested', { reason });

      dispatch(addNotification({
        type: 'info',
        title: 'Access Requested',
        message: 'Your access request has been submitted for review'
      }));

      return true;
    } catch (error) {
      console.error('Failed to request access:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const grantAccess = useCallback(async (
    documentId: string, 
    userId: string, 
    permissions: DocumentPermissions
  ): Promise<boolean> => {
    try {
      emit('grant-document-access', {
        documentId,
        userId,
        permissions,
        grantedBy: user?.id,
        grantTime: new Date()
      });

      // Log access grant
      await logAccess(documentId, 'access_granted', { 
        targetUserId: userId, 
        permissions 
      });

      dispatch(addNotification({
        type: 'success',
        title: 'Access Granted',
        message: `Access granted to user ${userId}`
      }));

      return true;
    } catch (error) {
      console.error('Failed to grant access:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const checkAccess = useCallback(async (documentId: string): Promise<DocumentPermissions | null> => {
    try {
      const response = await new Promise<DocumentPermissions | null>((resolve) => {
        emit('check-document-access', {
          documentId,
          userId: user?.id
        });

        const handler = (data: { documentId: string; permissions: DocumentPermissions | null }) => {
          if (data.documentId === documentId) {
            off('document-access-checked', handler);
            resolve(data.permissions);
          }
        };
        on('document-access-checked', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to check access:', error);
      return null;
    }
  }, [user?.id, emit, on, off]);

  const logAccess = useCallback(async (
    documentId: string, 
    action: string, 
    metadata?: any
  ): Promise<string | null> => {
    try {
      if (!blockchainInterface.current) {
        console.warn('Blockchain interface not available');
        return null;
      }

      const logEntry: AccessLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        userId: user?.id || '',
        action: 'viewed',                                                    //custom hardcoded action
        timestamp: new Date().toISOString(),
        ipAddress: '', // Would be filled by server
        userAgent: navigator.userAgent,
        metadata: metadata || {},
        blockchainHash: ''
      };

      // Create blockchain transaction
      const blockchainHash = await blockchainInterface.current.logTransaction(logEntry);
      logEntry.blockchainHash = blockchainHash;

      // Send to server for storage
      emit('log-document-access', logEntry);

      // Add to local logs
      setAccessLogs(prev => [...prev, logEntry]);

      return blockchainHash;
    } catch (error) {
      console.error('Failed to log access:', error);
      return null;
    }
  }, [user?.id, emit]);

  const getBlockchainLogs = useCallback(async (documentId: string): Promise<AccessLogEntry[]> => {
    try {
      const response = await new Promise<AccessLogEntry[]>((resolve) => {
        emit('get-blockchain-logs', { documentId });

        const handler = (data: { documentId: string; logs: AccessLogEntry[] }) => {
          if (data.documentId === documentId) {
            off('blockchain-logs-received', handler);
            resolve(data.logs);
          }
        };
        on('blockchain-logs-received', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to get blockchain logs:', error);
      return [];
    }
  }, [emit, on, off]);

  const verifyIntegrity = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      if (!blockchainInterface.current) return false;

      const logs = await getBlockchainLogs(documentId);
      
      // Verify each log entry against blockchain
      for (const log of logs) {
        const isValid = await blockchainInterface.current.verifyTransaction(
          log.blockchainHash, 
          log
        );
        if (!isValid) {
          dispatch(addNotification({
            type: 'error',
            title: 'Integrity Violation',
            message: `Document integrity compromised: invalid log entry ${log.id}`
          }));
          return false;
        }
      }

      dispatch(addNotification({
        type: 'success',
        title: 'Integrity Verified',
        message: 'Document integrity verification passed'
      }));

      return true;
    } catch (error) {
      console.error('Failed to verify integrity:', error);
      return false;
    }
  }, [getBlockchainLogs, dispatch]);

  const setExpirationTime = useCallback(async (
    documentId: string, 
    expirationTime: Date
  ): Promise<boolean> => {
    try {
      emit('set-document-expiration', {
        documentId,
        expirationTime,
        setBy: user?.id
      });

      // Log expiration setting
      await logAccess(documentId, 'expiration_set', { expirationTime });

      dispatch(addNotification({
        type: 'info',
        title: 'Expiration Set',
        message: `Document will expire on ${expirationTime.toLocaleString()}`
      }));

      return true;
    } catch (error) {
      console.error('Failed to set expiration time:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const extendAccess = useCallback(async (
    documentId: string, 
    additionalTime: number
  ): Promise<boolean> => {
    try {
      emit('extend-document-access', {
        documentId,
        additionalTime,
        extendedBy: user?.id
      });

      // Log access extension
      await logAccess(documentId, 'access_extended', { additionalTime });

      dispatch(addNotification({
        type: 'success',
        title: 'Access Extended',
        message: `Document access extended by ${additionalTime} hours`
      }));

      return true;
    } catch (error) {
      console.error('Failed to extend access:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const enableRealTimeMonitoring = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      const monitor = {
        documentId,
        startTime: new Date(),
        events: []
      };

      securityMonitors.current.set(documentId, monitor);

      emit('enable-document-monitoring', {
        documentId,
        enabledBy: user?.id
      });

      // Log monitoring activation
      await logAccess(documentId, 'monitoring_enabled', {});

      dispatch(addNotification({
        type: 'info',
        title: 'Monitoring Enabled',
        message: 'Real-time security monitoring is now active'
      }));

      return true;
    } catch (error) {
      console.error('Failed to enable monitoring:', error);
      return false;
    }
  }, [user?.id, emit, dispatch]);

  const getSecurityEvents = useCallback(async (documentId: string): Promise<any[]> => {
    try {
      const response = await new Promise<any[]>((resolve) => {
        emit('get-security-events', { documentId });

        const handler = (data: { documentId: string; events: any[] }) => {
          if (data.documentId === documentId) {
            off('security-events-received', handler);
            resolve(data.events);
          }
        };
        on('security-events-received', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }, [emit, on, off]);

  const downloadSecureDocument = useCallback(async (documentId: string): Promise<Blob | null> => {
    try {
      // Check access permissions first
      const permissions = await checkAccess(documentId);
      if (!permissions?.canDownload) {
        dispatch(addNotification({
          type: 'error',
          title: 'Access Denied',
          message: 'You do not have download permissions for this document'
        }));
        return null;
      }

      // Log download attempt
      await logAccess(documentId, 'download_attempted', {});

      const response = await new Promise<Blob | null>((resolve) => {
        emit('download-secure-document', {
          documentId,
          userId: user?.id
        });

        const handler = (data: { documentId: string; blob: Blob | null; error?: string }) => {
          if (data.documentId === documentId) {
            off('secure-document-downloaded', handler);
            if (data.error) {
              console.error('Download failed:', data.error);
              resolve(null);
            } else {
              resolve(data.blob);
            }
          }
        };
        on('secure-document-downloaded', handler);
      });

      if (response) {
        // Log successful download
        await logAccess(documentId, 'download_completed', {});
      }

      return response;
    } catch (error) {
      console.error('Failed to download document:', error);
      return null;
    }
  }, [checkAccess, user?.id, emit, on, off, dispatch]);

  const previewDocument = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      // Check access permissions
      const permissions = await checkAccess(documentId);
      if (!permissions?.canView) {
        dispatch(addNotification({
          type: 'error',
          title: 'Access Denied',
          message: 'You do not have view permissions for this document'
        }));
        return null;
      }

      // Log preview access
      await logAccess(documentId, 'preview_accessed', {});

      const response = await new Promise<string | null>((resolve) => {
        emit('preview-document', {
          documentId,
          userId: user?.id
        });

        const handler = (data: { documentId: string; previewUrl: string | null }) => {
          if (data.documentId === documentId) {
            off('document-preview-ready', handler);
            resolve(data.previewUrl);
          }
        };
        on('document-preview-ready', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to preview document:', error);
      return null;
    }
  }, [checkAccess, user?.id, emit, on, off, dispatch]);

  const getDocumentMetadata = useCallback(async (documentId: string): Promise<any> => {
    try {
      const response = await new Promise<any>((resolve) => {
        emit('get-document-metadata', { documentId });

        const handler = (data: { documentId: string; metadata: any }) => {
          if (data.documentId === documentId) {
            off('document-metadata-received', handler);
            resolve(data.metadata);
          }
        };
        on('document-metadata-received', handler);
      });

      return response;
    } catch (error) {
      console.error('Failed to get document metadata:', error);
      return null;
    }
  }, [emit, on, off]);

  const cleanupSecurityMonitors = useCallback(() => {
    securityMonitors.current.forEach((monitor, documentId) => {
      emit('disable-document-monitoring', { documentId });
    });
    securityMonitors.current.clear();
  }, [emit]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleDocumentsLoaded = (data: { documents: Document[] }) => {
      setDocuments(data.documents);
    };

    const handleDocumentProtected = (data: { protectedDocument: DRMProtectedDocument }) => {
      setProtectedDocuments(prev => [...prev, data.protectedDocument]);
    };

    const handleSecurityAlert = (data: { documentId: string; alert: any }) => {
      dispatch(addNotification({
        type: 'warning',
        title: 'Security Alert',
        message: `Security event detected on document: ${data.alert.message}`,
        persistent: true
      }));
    };

    const handleAccessRevoked = (data: { documentId: string; userId: string }) => {
      if (data.userId === user?.id) {
        dispatch(addNotification({
          type: 'warning',
          title: 'Access Revoked',
          message: 'Your access to a document has been revoked'
        }));
      }
    };

    on('documents-loaded', handleDocumentsLoaded);
    on('document-protected', handleDocumentProtected);
    on('security-alert', handleSecurityAlert);
    on('access-revoked', handleAccessRevoked);

    return () => {
      off('documents-loaded', handleDocumentsLoaded);
      off('document-protected', handleDocumentProtected);
      off('security-alert', handleSecurityAlert);
      off('access-revoked', handleAccessRevoked);
    };
  }, [socket, user?.id, on, off, dispatch]);

  return {
    // Document management
    documents,
    protectedDocuments,
    accessLogs,
    
    // DRM functions
    protectDocument,
    updateDocumentPermissions,
    revokeAccess,
    
    // Watermarking
    applyWatermark,
    removeWatermark,
    
    // Access control
    requestAccess,
    grantAccess,
    checkAccess,
    
    // Blockchain logging
    logAccess,
    getBlockchainLogs,
    verifyIntegrity,
    
    // Time-based controls
    setExpirationTime,
    extendAccess,
    
    // Monitoring
    enableRealTimeMonitoring,
    getSecurityEvents,
    
    // Utility functions
    downloadSecureDocument,
    previewDocument,
    getDocumentMetadata
  };
};
