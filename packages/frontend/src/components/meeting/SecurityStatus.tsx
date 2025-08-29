import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { SecurityOutlined, WarningOutlined } from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

export const SecurityStatus: React.FC = () => {
  const { securityStatus } = useAppSelector((state) => state.meeting);
  const { threats } = useAppSelector((state) => state.security);

  const getSecurityColor = () => {
    if (threats.length > 0) return 'error';
    if (securityStatus.active) return 'success';
    return 'warning';
  };

  const getSecurityLabel = () => {
    if (threats.length > 0) return `${threats.length} Threats`;
    if (securityStatus.active) return 'Secure';
    return 'Inactive';
  };

  return (
    <Tooltip title="Security monitoring status">
      <Chip
        icon={threats.length > 0 ? <WarningOutlined /> : <SecurityOutlined />}
        label={getSecurityLabel()}
        color={getSecurityColor()}
        size="small"
      />
    </Tooltip>
  );
};
