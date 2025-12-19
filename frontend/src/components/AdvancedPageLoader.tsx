import React, { useEffect, useState } from 'react';
import { Box, Fade, keyframes } from '@mui/material';
import type { Theme } from '@mui/material';
import { useLocation } from 'react-router-dom';

// Animations CSS
const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

interface AdvancedPageLoaderProps {
  variant?: 'shimmer' | 'gradient' | 'pulse' | 'dots';
  height?: number;
  duration?: number;
  color?: 'primary' | 'secondary' | 'rainbow';
}

export const AdvancedPageLoader: React.FC<AdvancedPageLoaderProps> = ({
  variant = 'shimmer',
  height = 2,
  duration = 600,
  color = 'primary',
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    // Terminer le chargement
    const timer = setTimeout(() => {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [location.pathname, duration]);

  const getLoaderStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      height,
    };

    switch (variant) {
      case 'shimmer':
        return {
          ...baseStyles,
          background: (theme: Theme) => 
            color === 'rainbow'
              ? 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)'
              : `linear-gradient(90deg, transparent, ${theme.palette[color].main}40, transparent)`,
          backgroundSize: color === 'rainbow' ? '200% 100%' : '200% 100%',
          animation: `${shimmer} 1.5s infinite, ${gradientShift} 3s ease infinite`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: (theme: Theme) => 
              color === 'rainbow'
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                : `linear-gradient(90deg, transparent, ${theme.palette[color].main}80, transparent)`,
            animation: `${shimmer} 1.5s infinite`,
          },
        };

      case 'gradient':
        return {
          ...baseStyles,
          background: (theme: Theme) => 
            color === 'rainbow'
              ? 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)'
              : `linear-gradient(90deg, ${theme.palette[color].light}, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
          backgroundSize: '200% 100%',
          animation: `${gradientShift} 2s ease infinite`,
          boxShadow: (theme: Theme) => {
            if (color === 'rainbow') {
              return '0 0 20px rgba(255, 107, 107, 0.4)';
            }
            return `0 0 20px ${theme.palette[color].main}40`;
          },
        };

      case 'pulse':
        return {
          ...baseStyles,
          background: (theme: Theme) => {
            if (color === 'rainbow') {
              return '#ff6b6b';
            }
            return theme.palette[color].main;
          },
          animation: `${pulse} 1s ease-in-out infinite`,
          boxShadow: (theme: Theme) => {
            if (color === 'rainbow') {
              return '0 0 15px rgba(255, 107, 107, 0.6)';
            }
            return `0 0 15px ${theme.palette[color].main}60`;
          },
        };

      case 'dots':
        return {
          ...baseStyles,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          '&::before, &::after': {
            content: '""',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: (theme: Theme) => {
              if (color === 'rainbow') {
                return '#ff6b6b';
              }
              return theme.palette[color].main;
            },
            animation: `${pulse} 1.4s ease-in-out infinite both`,
          },
          '&::before': {
            animationDelay: '-0.32s',
            marginRight: 4,
          },
          '&::after': {
            animationDelay: '-0.16s',
          },
        };

      default:
        return baseStyles;
    }
  };

  return (
    <Fade in={isLoading} timeout={200}>
      <Box sx={getLoaderStyles()} />
    </Fade>
  );
};

// Version avec barre de progression moderne
export const ModernPageLoader: React.FC<AdvancedPageLoaderProps> = (props) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    // Animation avec easing
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const easeOutCubic = 1 - Math.pow(1 - elapsed / (props.duration || 600), 3);
      const newProgress = Math.min(easeOutCubic * 100, 98);
      
      setProgress(newProgress);
      
      if (newProgress < 98) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 400);
    }, props.duration || 600);

    return () => clearTimeout(timer);
  }, [location.pathname, props.duration]);

  return (
    <Fade in={isLoading} timeout={150}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: props.height || 3,
          background: 'transparent',
          overflow: 'hidden',
        }}
      >
        {/* Barre de progression principale */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${progress}%`,
            background: (theme: Theme) => 
              props.color === 'rainbow'
                ? 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)'
                : `linear-gradient(90deg, ${theme.palette[props.color || 'primary'].light}, ${theme.palette[props.color || 'primary'].main})`,
            backgroundSize: props.color === 'rainbow' ? '200% 100%' : '100% 100%',
            animation: props.color === 'rainbow' ? `${gradientShift} 2s ease infinite` : 'none',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: (theme: Theme) => {
              if (props.color === 'rainbow') {
                return '0 0 10px rgba(255, 107, 107, 0.4)';
              }
              return `0 0 10px ${theme.palette[props.color || 'primary'].main}40`;
            },
          }}
        />
        
        {/* Effet de brillance */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: `${shimmer} 2s infinite`,
            transform: `translateX(-${100 - progress}%)`,
          }}
        />
      </Box>
    </Fade>
  );
};
