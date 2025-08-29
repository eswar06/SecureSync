import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  BusinessCenterOutlined,
  LocalHospitalOutlined,
  AccountBalanceOutlined,
  SchoolOutlined,
  FactoryOutlined,
  StorefrontOutlined,
  GavelOutlined,
  SecurityOutlined,
  CodeOutlined,
  ScienceOutlined,
  ExpandMoreOutlined,
  SettingsOutlined,
  CheckCircleOutlined,
  InfoOutlined
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addNotification } from '../../store/slices/notificationsSlice';

interface IndustryModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  complianceFrameworks: string[];
  customFields: any[];
  workflows: any[];
  templates: any[];
  integrations: string[];
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  isActive: boolean;
}

const industryModules: IndustryModule[] = [
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    description: 'HIPAA-compliant collaboration with patient data protection',
    icon: <LocalHospitalOutlined />,
    features: [
      'HIPAA Compliance Tools',
      'Patient Data Encryption',
      'Medical Record Templates',
      'Telemedicine Integration',
      'Clinical Trial Management',
      'FDA Submission Workflows'
    ],
    complianceFrameworks: ['HIPAA', 'FDA 21 CFR Part 11', 'GDPR', 'HITECH'],
    customFields: [
      { name: 'Patient ID', type: 'encrypted', required: true },
      { name: 'Medical Record Number', type: 'masked', required: true },
      { name: 'Treatment Phase', type: 'select', options: ['Phase I', 'Phase II', 'Phase III'] }
    ],
    workflows: [
      'Patient Consultation',
      'Clinical Research',
      'Regulatory Submission',
      'Medical Device Review'
    ],
    templates: [
      'Clinical Study Report',
      'Patient Consent Form',
      'Adverse Event Report',
      'Medical Device Protocol'
    ],
    integrations: ['Epic', 'Cerner', 'Allscripts', 'eClinicalWorks'],
    securityLevel: 'maximum',
    isActive: false
  },
  {
    id: 'finance',
    name: 'Financial Services',
    description: 'SOX-compliant financial collaboration with audit trails',
    icon: <AccountBalanceOutlined />,
    features: [
      'SOX Compliance Dashboard',
      'Financial Data Encryption',
      'Trading Communication',
      'Regulatory Reporting',
      'Risk Assessment Tools',
      'Audit Trail Management'
    ],
    complianceFrameworks: ['SOX', 'PCI DSS', 'GDPR', 'CCPA', 'MiFID II'],
    customFields: [
      { name: 'Account Number', type: 'encrypted', required: true },
      { name: 'Transaction ID', type: 'masked', required: true },
      { name: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
    ],
    workflows: [
      'Trade Settlement',
      'Compliance Review',
      'Risk Assessment',
      'Regulatory Filing'
    ],
    templates: [
      'Trade Confirmation',
      'Risk Assessment Report',
      'Compliance Checklist',
      'Audit Documentation'
    ],
    integrations: ['Bloomberg Terminal', 'Reuters Eikon', 'Morningstar', 'FactSet'],
    securityLevel: 'maximum',
    isActive: false
  },
  {
    id: 'legal',
    name: 'Legal & Law Firms',
    description: 'Attorney-client privilege protection with legal workflows',
    icon: <GavelOutlined />,
    features: [
      'Attorney-Client Privilege',
      'Case Management',
      'Legal Document Templates',
      'Court Filing Integration',
      'Billing & Time Tracking',
      'Conflict Checking'
    ],
    complianceFrameworks: ['ABA Model Rules', 'GDPR', 'CCPA', 'State Bar Requirements'],
    customFields: [
      { name: 'Case Number', type: 'text', required: true },
      { name: 'Client Matter', type: 'encrypted', required: true },
      { name: 'Practice Area', type: 'select', options: ['Corporate', 'Litigation', 'IP', 'Real Estate'] }
    ],
    workflows: [
      'Case Intake',
      'Discovery Process',
      'Court Filing',
      'Client Communication'
    ],
    templates: [
      'Legal Brief',
      'Contract Template',
      'Discovery Request',
      'Settlement Agreement'
    ],
    integrations: ['LexisNexis', 'Westlaw', 'Clio', 'MyCase'],
    securityLevel: 'maximum',
    isActive: false
  },
  {
    id: 'technology',
    name: 'Technology & Software',
    description: 'Agile development collaboration with IP protection',
    icon: <CodeOutlined />,
    features: [
      'Code Review Workflows',
      'IP Protection',
      'Technical Documentation',
      'Bug Tracking Integration',
      'Release Management',
      'Developer Onboarding'
    ],
    complianceFrameworks: ['ISO 27001', 'SOC 2', 'GDPR', 'CCPA'],
    customFields: [
      { name: 'Repository', type: 'text', required: true },
      { name: 'Sprint', type: 'text', required: false },
      { name: 'Priority', type: 'select', options: ['P0', 'P1', 'P2', 'P3'] }
    ],
    workflows: [
      'Code Review',
      'Bug Triage',
      'Release Planning',
      'Security Assessment'
    ],
    templates: [
      'Technical Specification',
      'Bug Report',
      'Release Notes',
      'API Documentation'
    ],
    integrations: ['GitHub', 'GitLab', 'Jira', 'Confluence'],
    securityLevel: 'enhanced',
    isActive: true
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    description: 'Supply chain collaboration with quality management',
    icon: <FactoryOutlined />,
    features: [
      'Supply Chain Management',
      'Quality Control Workflows',
      'Safety Compliance',
      'Production Planning',
      'Vendor Communication',
      'Equipment Documentation'
    ],
    complianceFrameworks: ['ISO 9001', 'ISO 14001', 'OSHA', 'FDA'],
    customFields: [
      { name: 'Part Number', type: 'text', required: true },
      { name: 'Batch Number', type: 'text', required: true },
      { name: 'Quality Status', type: 'select', options: ['Pass', 'Fail', 'Under Review'] }
    ],
    workflows: [
      'Quality Inspection',
      'Supplier Audit',
      'Production Review',
      'Safety Incident'
    ],
    templates: [
      'Quality Report',
      'Safety Incident Form',
      'Supplier Evaluation',
      'Production Schedule'
    ],
    integrations: ['SAP', 'Oracle SCM', 'Siemens PLM', 'Autodesk'],
    securityLevel: 'enhanced',
    isActive: false
  },
  {
    id: 'education',
    name: 'Education & Academia',
    description: 'FERPA-compliant educational collaboration',
    icon: <SchoolOutlined />,
    features: [
      'FERPA Compliance',
      'Student Data Protection',
      'Research Collaboration',
      'Course Management',
      'Academic Publishing',
      'Grant Management'
    ],
    complianceFrameworks: ['FERPA', 'COPPA', 'GDPR', 'CCPA'],
    customFields: [
      { name: 'Student ID', type: 'encrypted', required: true },
      { name: 'Course Code', type: 'text', required: true },
      { name: 'Academic Level', type: 'select', options: ['Undergraduate', 'Graduate', 'Doctoral'] }
    ],
    workflows: [
      'Course Planning',
      'Research Proposal',
      'Grant Application',
      'Academic Review'
    ],
    templates: [
      'Syllabus Template',
      'Research Proposal',
      'Grant Application',
      'Academic Paper'
    ],
    integrations: ['Canvas', 'Blackboard', 'Moodle', 'Google Classroom'],
    securityLevel: 'enhanced',
    isActive: false
  }
];

export const IndustryModules: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [modules, setModules] = useState<IndustryModule[]>(industryModules);
  const [selectedModule, setSelectedModule] = useState<IndustryModule | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateModule = async (moduleId: string) => {
    setIsActivating(true);
    
    try {
      // Simulate activation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, isActive: true }
          : module
      ));

      const module = modules.find(m => m.id === moduleId);
      
      dispatch(addNotification({
        type: 'success',
        title: 'Module Activated',
        message: `${module?.name} module has been successfully activated`
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Activation Failed',
        message: 'Failed to activate the industry module'
      }));
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivateModule = async (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isActive: false }
        : module
    ));

    const module = modules.find(m => m.id === moduleId);
    
    dispatch(addNotification({
      type: 'info',
      title: 'Module Deactivated',
      message: `${module?.name} module has been deactivated`
    }));
  };

  const renderModuleCard = (module: IndustryModule) => (
    <Grid item xs={12} md={6} lg={4} key={module.id}>
      <Card
        sx={{
          height: '100%',
          border: module.isActive ? 2 : 1,
          borderColor: module.isActive ? 'success.main' : 'divider',
          position: 'relative'
        }}
      >
        {module.isActive && (
          <Chip
            label="Active"
            color="success"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1
            }}
          />
        )}
        
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              {module.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {module.name}
              </Typography>
              <Chip
                label={module.securityLevel}
                size="small"
                color={
                  module.securityLevel === 'maximum' ? 'error' :
                  module.securityLevel === 'enhanced' ? 'warning' : 'default'
                }
              />
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {module.description}
          </Typography>

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Key Features:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {module.features.slice(0, 3).map((feature) => (
                <Chip
                  key={feature}
                  label={feature}
                  size="small"
                  variant="outlined"
                />
              ))}
              {module.features.length > 3 && (
                <Chip
                  label={`+${module.features.length - 3} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Compliance:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {module.complianceFrameworks.slice(0, 2).map((framework) => (
                <Chip
                  key={framework}
                  label={framework}
                  size="small"
                  color="secondary"
                />
              ))}
              {module.complianceFrameworks.length > 2 && (
                <Chip
                  label={`+${module.complianceFrameworks.length - 2}`}
                  size="small"
                  color="secondary"
                />
              )}
            </Box>
          </Box>

          <Box display="flex" gap={1} mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedModule(module);
                setShowDetailsDialog(true);
              }}
            >
              Details
            </Button>
            
            {module.isActive ? (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDeactivateModule(module.id)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => handleActivateModule(module.id)}
                disabled={isActivating}
              >
                Activate
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderDetailsDialog = () => {
    if (!selectedModule) return null;

    return (
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedModule.icon}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedModule.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedModule.description}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Features */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Typography variant="h6">Features & Capabilities</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {selectedModule.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleOutlined color="success" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Compliance */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Typography variant="h6">Compliance Frameworks</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {selectedModule.complianceFrameworks.map((framework) => (
                    <Grid item key={framework}>
                      <Chip
                        label={framework}
                        color="secondary"
                        icon={<SecurityOutlined />}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Workflows */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Typography variant="h6">Pre-built Workflows</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {selectedModule.workflows.map((workflow, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <BusinessCenterOutlined />
                      </ListItemIcon>
                      <ListItemText primary={workflow} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Templates */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Typography variant="h6">Document Templates</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {selectedModule.templates.map((template, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoOutlined />
                      </ListItemIcon>
                      <ListItemText primary={template} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Integrations */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Typography variant="h6">System Integrations</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {selectedModule.integrations.map((integration) => (
                    <Grid item key={integration}>
                      <Chip
                        label={integration}
                        variant="outlined"
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Security Level */}
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom>
                Security Level: {selectedModule.securityLevel.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedModule.securityLevel === 'maximum' && 
                  'Maximum security with end-to-end encryption, blockchain logging, and comprehensive audit trails.'}
                {selectedModule.securityLevel === 'enhanced' && 
                  'Enhanced security with advanced encryption, detailed logging, and compliance monitoring.'}
                {selectedModule.securityLevel === 'standard' && 
                  'Standard security with basic encryption and standard audit capabilities.'}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          {!selectedModule.isActive && (
            <Button
              variant="contained"
              onClick={() => {
                handleActivateModule(selectedModule.id);
                setShowDetailsDialog(false);
              }}
              disabled={isActivating}
            >
              Activate Module
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Industry Modules
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Customize SecureSync Pro for your industry with specialized features, 
          compliance frameworks, and workflow templates.
        </Typography>
        
        {modules.filter(m => m.isActive).length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have {modules.filter(m => m.isActive).length} active industry module(s). 
            These provide specialized features and compliance tools for your organization.
          </Alert>
        )}
      </Box>

      {/* Loading indicator */}
      {isActivating && (
        <Box mb={2}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Activating industry module and configuring specialized features...
          </Typography>
        </Box>
      )}

      {/* Active Modules Section */}
      {modules.some(m => m.isActive) && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Active Modules
          </Typography>
          <Grid container spacing={3}>
            {modules.filter(m => m.isActive).map(renderModuleCard)}
          </Grid>
        </Box>
      )}

      {/* Available Modules Section */}
      <Box>
        <Typography variant="h5" gutterBottom>
          Available Modules
        </Typography>
        <Grid container spacing={3}>
          {modules.filter(m => !m.isActive).map(renderModuleCard)}
        </Grid>
      </Box>

      {/* Details Dialog */}
      {renderDetailsDialog()}
    </Box>
  );
};
