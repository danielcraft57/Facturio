import { Paper, Typography, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type Props = {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: IconDefinition;
};

export function SelectionCard({ label, selected, onClick, icon }: Props) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'action.selected' : 'background.paper',
        borderRadius: 1.5,
        textAlign: 'center',
        transition: 'border-color 0.15s, transform 0.1s',
        '&:hover': { borderColor: 'primary.light', transform: 'translateY(-1px)' },
      }}
    >
      {icon && (
        <Box sx={{ mb: 0.75, color: selected ? 'primary.main' : 'text.secondary' }}>
          <FontAwesomeIcon icon={icon} style={{ fontSize: 22 }} />
        </Box>
      )}
      <Typography variant="body2" fontWeight={selected ? 600 : 400}>
        {label}
      </Typography>
    </Paper>
  );
}
