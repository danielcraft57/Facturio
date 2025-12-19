import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack
} from '@mui/material';
import { DateRange as DateRangeIcon } from '@mui/icons-material';

interface PeriodFilterProps {
  period: string;
  onPeriodChange: (period: string) => void;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({ period, onPeriodChange }) => {
  const periods = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: '6m', label: '6 derniers mois' },
    { value: '1y', label: '12 derniers mois' },
    { value: 'all', label: 'Toute la période' }
  ];

  return (
    <Box sx={{ 
      mb: 4,
      p: 3,
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
      borderRadius: 3,
      border: '1px solid rgba(102, 126, 234, 0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <DateRangeIcon sx={{ fontSize: 20 }} />
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: 'rgba(0, 0, 0, 0.6)', fontWeight: 500 }}>
            Période d'analyse
          </InputLabel>
          <Select
            value={period}
            label="Période d'analyse"
            onChange={(e) => onPeriodChange(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(102, 126, 234, 0.2)',
                borderWidth: 2
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(102, 126, 234, 0.4)'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea'
              },
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {periods.map((p) => (
              <MenuItem key={p.value} value={p.value} sx={{ fontWeight: 500 }}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button 
          variant="outlined" 
          size="small"
          sx={{
            borderColor: 'rgba(102, 126, 234, 0.3)',
            color: '#667eea',
            fontWeight: 500,
            borderRadius: 2,
            px: 3,
            py: 1,
            '&:hover': {
              borderColor: '#667eea',
              background: 'rgba(102, 126, 234, 0.05)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Période personnalisée
        </Button>
      </Stack>
    </Box>
  );
};
