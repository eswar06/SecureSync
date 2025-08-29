import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CloseOutlined,
  SecurityOutlined,
  LockOutlined,
  VerifiedUserOutlined,
  AccessTimeOutlined,
  DownloadOutlined,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutlined,
  ExpandMoreOutlined,
  BlockOutlined,
  WaterOutlined,
  AccountTreeOutlined,
  MonitorOutlined,
  HistoryOutlined
} from '@mui/icons-material';
import { useDocumentSecurity } from '../../hooks/useDocumentSecurity';
import { DocumentPermissions, WatermarkConfig, WatermarkPosition } from '../../../../shared/src/types/index';

interface DocumentSecurityPanelProps {
  open: boolean;
  onClose: () => void;
  documentId?: string;
}

export const DocumentSecurityPanel: React.FC<DocumentSecurityPanelProps> = ({
  open,
  onClose,
  documentId
}) => {
  const {
    documents,
    protectedDocuments,
    accessLogs,
    protectDocument,
    updateDocumentPermissions,
    revokeAccess,
    applyWatermark,
    checkAccess,
    logAccess,
    getBlockchainLogs,
    verifyIntegrity,
    setExpirationTime,
    enableRealTimeMonitoring,
    downloadSecureDocument,
    previewDocument
  } = useDocumentSecurity();

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [blockchainLogs, setBlockchainLogs] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [permissions, setPermissions] = useState<DocumentPermissions>({
    canView: true,
    canDownload: false,
    canPrint: false,
    canShare: false,
    canEdit: false,
    canDelete:false,
    maxViews: undefined,
    allowedDownloads: 0,
    expirationTime: undefined,
    allowScreenshot: false,
    allowCopy: false,
    requireAuthentication: true
  });

  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    text: 'CONFIDENTIAL',
    opacity: 0.3,
    position: WatermarkPosition.CENTER,
    fontSize: 12,
    color: '#666666',
    rotation: 45
  });

  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d.id === documentId) || 
                  protectedDocuments.find(d => d.id === documentId || d.originalDocumentId === documentId);
      setSelectedDoc(doc);
    }
  }, [documentId, documents, protectedDocuments]);

  const handleProtectDocument = async () => {
    if (selectedDoc) {
      await protectDocument(selectedDoc, permissions);
      setShowPermissionsDialog(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (selectedDoc) {
      await updateDocumentPermissions(selectedDoc.id, permissions);
      setShowPermissionsDialog(false);
    }
  };

  const handleApplyWatermark = async () => {
    if (selectedDoc) {
      await applyWatermark(selectedDoc.id, watermarkConfig);
      setShowWatermarkDialog(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    if (selectedDoc) {
      setIsVerifying(true);
      await verifyIntegrity(selectedDoc.id);
      setIsVerifying(false);
    }
  };

  const handleViewLogs = async () => {
    if (selectedDoc) {
      const logs = await getBlockchainLogs(selectedDoc.id);
      setBlockchainLogs(logs);
      setShowLogsDialog(true);
    }
  };

  const handleDownload = async () => {
    if (selectedDoc) {
      const blob = await downloadSecureDocument(selectedDoc.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedDoc.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handlePreview = async () => {
    if (selectedDoc) {
      const previewUrl = await previewDocument(selectedDoc.id);
      if (previewUrl) {
        window.open(previewUrl, '_blank');
      }
    }
  };

  const renderDocumentList = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Documents
      </Typography>
      
      <List>
        {documents.map((doc) => {
          const protectedDoc = protectedDocuments.find(
            p => p.originalDocumentId === doc.id
          );
          
          return (
            <ListItem
              key={doc.id}
              button
              onClick={() => setSelectedDoc(doc)}
              selected={selectedDoc?.id === doc.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemText
                primary={doc.name}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      {protectedDoc ? (
                        <Chip
                          icon={<LockOutlined />}
                          label="DRM Protected"
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Chip
                          label="Unprotected"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      
                      {protectedDoc?.permissions.expirationTime && (
                        <Chip
                          icon={<AccessTimeOutlined />}
                          label="Expires"
                          size="small"
                          color="warning"
                        />
                      )}
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => setSelectedDoc(doc)}>
                  <SecurityOutlined />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  const renderDocumentDetails = () => {
    if (!selectedDoc) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            Select a document to view security details
          </Typography>
        </Box>
      );
    }

    const protectedDoc = protectedDocuments.find(
      p => p.originalDocumentId === selectedDoc.id || p.id === selectedDoc.id
    );

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {selectedDoc.name}
        </Typography>

        {/* Security Status */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  {protectedDoc ? (
                    <LockOutlined sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  ) : (
                    <LockOutlined sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                  )}
                  <Typography variant="body2">
                    {protectedDoc ? 'DRM Protected' : 'Unprotected'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <VerifiedUserOutlined sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2">
                    Blockchain Verified
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Actions */}
        <Box display="flex" gap={1} mb={2}>
          {!protectedDoc ? (
            <Button
              variant="contained"
              startIcon={<LockOutlined />}
              onClick={() => setShowPermissionsDialog(true)}
            >
              Protect Document
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<EditOutlined />}
                onClick={() => setShowPermissionsDialog(true)}
              >
                Edit Permissions
              </Button>
              <Button
                variant="outlined"
                startIcon={<WaterOutlined />}
                onClick={() => setShowWatermarkDialog(true)}
              >
                Watermark
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<VisibilityOutlined />}
            onClick={handlePreview}
          >
            Preview
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Box>

        {/* Security Features */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Security Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<MonitorOutlined />}
                onClick={() => enableRealTimeMonitoring(selectedDoc.id)}
                size="small"
              >
                Enable Monitoring
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<BlockOutlined />}
                onClick={() => revokeAccess(selectedDoc.id)}
                size="small"
                color="error"
              >
                Revoke All Access
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<AccountTreeOutlined />}
                onClick={handleVerifyIntegrity}
                disabled={isVerifying}
                size="small"
              >
                {isVerifying ? 'Verifying...' : 'Verify Integrity'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HistoryOutlined />}
                onClick={handleViewLogs}
                size="small"
              >
                View Logs
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Permissions Summary */}
        {protectedDoc && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
              <Typography variant="subtitle1">Current Permissions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                {Object.entries(protectedDoc.permissions).map(([key, value]) => (
                  <Grid item xs={6} key={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" sx={{ minWidth: 100 }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </Typography>
                      {typeof value === 'boolean' ? (
                        <Chip
                          label={value ? 'Yes' : 'No'}
                          size="small"
                          color={value ? 'success' : 'default'}
                        />
                      ) : (
                        <Typography variant="caption">
                          {value?.toString() || 'Not set'}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Access Logs Summary */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
            <Typography variant="subtitle1">Recent Activity</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {accessLogs
                .filter(log => log.documentId === selectedDoc.id)
                .slice(0, 5)
                .map((log) => (
                  <ListItem key={log.id}>
                    <ListItemText
                      primary={(log.action ?? '').replace(/_/g, ' ').toUpperCase()}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            User: {log.userId}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No timestamp'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { width: 500, p: 2 } }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityOutlined color="primary" />
            <Typography variant="h6">Document Security</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {documentId ? renderDocumentDetails() : renderDocumentList()}
        </Box>
      </Drawer>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onClose={() => setShowPermissionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Document Permissions</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={permissions.canView}
                    onChange={(e) => setPermissions(prev => ({ ...prev, canView: e.target.checked }))}
                  />
                }
                label="Can View"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={permissions.canDownload}
                    onChange={(e) => setPermissions(prev => ({ ...prev, canDownload: e.target.checked }))}
                  />
                }
                label="Can Download"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={permissions.canPrint}
                    onChange={(e) => setPermissions(prev => ({ ...prev, canPrint: e.target.checked }))}
                  />
                }
                label="Can Print"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={permissions.canShare}
                    onChange={(e) => setPermissions(prev => ({ ...prev, canShare: e.target.checked }))}
                  />
                }
                label="Can Share"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={permissions.allowScreenshot}
                    onChange={(e) => setPermissions(prev => ({ ...prev, allowScreenshot: e.target.checked }))}
                  />
                }
                label="Allow Screenshots"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={permissions.allowCopy}
                    onChange={(e) => setPermissions(prev => ({ ...prev, allowCopy: e.target.checked }))}
                  />
                }
                label="Allow Copy"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="number"
                label="Max Views"
                value={permissions.maxViews || ''}
                onChange={(e) => setPermissions(prev => ({ 
                  ...prev, 
                  maxViews: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="number"
                label="Allowed Downloads"
                value={permissions.allowedDownloads || 0}
                onChange={(e) => setPermissions(prev => ({ 
                  ...prev, 
                  allowedDownloads: parseInt(e.target.value) || 0 
                }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                type="datetime-local"
                label="Expiration Time"
                value={permissions.expirationTime ? 
                  new Date(permissions.expirationTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPermissions(prev => ({ 
                  ...prev, 
                  expirationTime: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermissionsDialog(false)}>Cancel</Button>
          <Button
            onClick={protectedDocuments.find(p => p.originalDocumentId === selectedDoc?.id) ? 
              handleUpdatePermissions : handleProtectDocument}
            variant="contained"
          >
            {protectedDocuments.find(p => p.originalDocumentId === selectedDoc?.id) ? 
              'Update Permissions' : 'Protect Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Watermark Dialog */}
      <Dialog open={showWatermarkDialog} onClose={() => setShowWatermarkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Watermark Configuration</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Watermark Text"
              value={watermarkConfig.text}
              onChange={(e) => setWatermarkConfig(prev => ({ ...prev, text: e.target.value }))}
              fullWidth
            />
            
            <TextField
              type="number"
              label="Opacity (0-1)"
              value={watermarkConfig.opacity}
              onChange={(e) => setWatermarkConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
              inputProps={{ min: 0, max: 1, step: 0.1 }}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={watermarkConfig.position}
                label="Position"
                onChange={(e) => setWatermarkConfig(prev => ({ ...prev, position: e.target.value as any }))}
              >
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="top-left">Top Left</MenuItem>
                <MenuItem value="top-right">Top Right</MenuItem>
                <MenuItem value="bottom-left">Bottom Left</MenuItem>
                <MenuItem value="bottom-right">Bottom Right</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              type="number"
              label="Font Size"
              value={watermarkConfig.fontSize}
              onChange={(e) => setWatermarkConfig(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWatermarkDialog(false)}>Cancel</Button>
          <Button onClick={handleApplyWatermark} variant="contained">
            Apply Watermark
          </Button>
        </DialogActions>
      </Dialog>

      {/* Blockchain Logs Dialog */}
      <Dialog open={showLogsDialog} onClose={() => setShowLogsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Blockchain Access Logs</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Blockchain Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blockchainLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.action.replace(/_/g, ' ').toUpperCase()}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {log.blockchainHash?.substring(0, 16)}...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
