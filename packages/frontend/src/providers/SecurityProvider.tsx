import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { addThreat, setMonitoring } from '../store/slices/securitySlice';
import { SecurityThreat, ThreatType, ThreatSeverity } from '../../../shared/src/types';

interface SecurityContextType {
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  reportThreat: (threat: Omit<SecurityThreat, 'id' | 'detectedAt'>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isMonitoring, setIsMonitoringState] = useState(false);

  const startMonitoring = () => {
    setIsMonitoringState(true);
    dispatch(setMonitoring(true));
    
    // Initialize security monitoring
    initializeSecurityChecks();
  };

  const stopMonitoring = () => {
    setIsMonitoringState(false);
    dispatch(setMonitoring(false));
  };

  const reportThreat = (threat: Omit<SecurityThreat, 'id' | 'detectedAt'>) => {
    const fullThreat: SecurityThreat = {
      ...threat,
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detectedAt: new Date(),
    };
    
    dispatch(addThreat(fullThreat));
    
    // Handle threat based on severity
    handleThreat(fullThreat);
  };

  const initializeSecurityChecks = () => {
    // Check for MediaRecorder API override
    checkMediaRecorderAPI();
    
    // Check for screen capture capabilities
    checkScreenCaptureAPI();
    
    // Monitor for suspicious activity
    monitorSuspiciousActivity();
  };

  const checkMediaRecorderAPI = () => {
    try {
      // Check if MediaRecorder has been tampered with
      if (typeof window.MediaRecorder !== 'function') {
        reportThreat({
          type: ThreatType.MEDIA_RECORDER,
          severity: ThreatSeverity.HIGH,
          description: 'MediaRecorder API has been modified or blocked',
          userId: 'current_user', // Would be actual user ID
          meetingId: 'current_meeting', // Would be actual meeting ID
          evidence: {
            metadata: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            }
          },
          resolved: false,
        });
      }
    } catch (error) {
      console.warn('Error checking MediaRecorder API:', error);
    }
  };

  const checkScreenCaptureAPI = () => {
    try {
      // Check for screen capture APIs
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // Override getDisplayMedia to detect usage
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = function(...args) {
          reportThreat({
            type: ThreatType.SCREEN_RECORDING,
            severity: ThreatSeverity.CRITICAL,
            description: 'Screen capture attempt detected',
            userId: 'current_user',
            meetingId: 'current_meeting',
            evidence: {
              metadata: {
                method: 'getDisplayMedia',
                args: args.length,
                timestamp: new Date().toISOString(),
              }
            },
            resolved: false,
          });
          
          throw new Error('Screen capture is not allowed in SecureSync Pro');
        };
      }
    } catch (error) {
      console.warn('Error setting up screen capture detection:', error);
    }
  };

  const monitorSuspiciousActivity = () => {
    // Monitor for developer tools
    let devtools = {
      open: false,
      orientation: null
    };
    
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          reportThreat({
            type: ThreatType.UNAUTHORIZED_ACCESS,
            severity: ThreatSeverity.MEDIUM,
            description: 'Developer tools opened',
            userId: 'current_user',
            meetingId: 'current_meeting',
            evidence: {
              metadata: {
                windowDimensions: {
                  outerWidth: window.outerWidth,
                  outerHeight: window.outerHeight,
                  innerWidth: window.innerWidth,
                  innerHeight: window.innerHeight,
                },
                timestamp: new Date().toISOString(),
              }
            },
            resolved: false,
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Monitor for right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      reportThreat({
        type: ThreatType.UNAUTHORIZED_ACCESS,
        severity: ThreatSeverity.LOW,
        description: 'Right-click context menu attempted',
        userId: 'current_user',
        meetingId: 'current_meeting',
        evidence: {
          metadata: {
            target: e.target || 'unknown', //removed e.target.tagName
            timestamp: new Date().toISOString(),
          }
        },
        resolved: false,
      });
    });

    // Monitor for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Detect common screenshot/recording shortcuts
      const suspiciousShortcuts = [
        { key: 'PrintScreen', ctrl: false, alt: false, shift: false },
        { key: 'F12', ctrl: false, alt: false, shift: false },
        { key: 'I', ctrl: true, alt: false, shift: true },
        { key: 'J', ctrl: true, alt: false, shift: true },
        { key: 'U', ctrl: true, alt: false, shift: false },
      ];

      const current = {
        key: e.key,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
      };

      const isSuspicious = suspiciousShortcuts.some(shortcut =>
        shortcut.key === current.key &&
        shortcut.ctrl === current.ctrl &&
        shortcut.alt === current.alt &&
        shortcut.shift === current.shift
      );

      if (isSuspicious) {
        e.preventDefault();
        reportThreat({
          type: ThreatType.UNAUTHORIZED_ACCESS,
          severity: ThreatSeverity.MEDIUM,
          description: `Suspicious keyboard shortcut detected: ${e.key}`,
          userId: 'current_user',
          meetingId: 'current_meeting',
          evidence: {
            metadata: {
              key: e.key,
              ctrlKey: e.ctrlKey,
              altKey: e.altKey,
              shiftKey: e.shiftKey,
              timestamp: new Date().toISOString(),
            }
          },
          resolved: false,
        });
      }
    });
  };

  const handleThreat = (threat: SecurityThreat) => {
    switch (threat.severity) {
      case ThreatSeverity.CRITICAL:
        // Could trigger immediate disconnection or alerts
        console.error('CRITICAL SECURITY THREAT:', threat);
        break;
      case ThreatSeverity.HIGH:
        console.warn('HIGH SECURITY THREAT:', threat);
        break;
      case ThreatSeverity.MEDIUM:
        console.warn('MEDIUM SECURITY THREAT:', threat);
        break;
      case ThreatSeverity.LOW:
        console.info('LOW SECURITY THREAT:', threat);
        break;
    }
  };

  useEffect(() => {
    // Auto-start monitoring when provider mounts
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, []);

  const value: SecurityContextType = {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    reportThreat,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
