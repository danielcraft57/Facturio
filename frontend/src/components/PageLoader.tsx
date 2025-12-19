import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';

interface PageLoaderProps {
  color?: string;
  height?: number;
  duration?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  color = 'primary',
  height = 3,
  duration = 800,
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Démarrer le chargement
    setIsLoading(true);
    setProgress(0);

    // Animation de progression
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 90); // S'arrêter à 90%
      
      setProgress(newProgress);
      
      if (newProgress < 90) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Terminer le chargement après un délai
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, duration]);

  return (
    <Fade in={isLoading} timeout={150}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: height,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: height,
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: (theme) => 
                color === 'primary' 
                  ? theme.palette.primary.main 
                  : color === 'secondary'
                  ? theme.palette.secondary.main
                  : color,
              transition: 'width 0.2s ease-out',
              boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}40`,
            },
            '& .MuiLinearProgress-root': {
              backgroundColor: 'transparent',
            },
          }}
        />
      </Box>
    </Fade>
  );
};
