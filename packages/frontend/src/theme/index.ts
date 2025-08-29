import { createTheme, ThemeOptions } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

// Atlassian-inspired color palette
const atlassianColors = {
  primary: {
    main: '#0052CC',
    light: '#4C9AFF',
    dark: '#0747A6',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#36B37E',
    light: '#57D9A3',
    dark: '#006644',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#DE350B',
    light: '#FF7452',
    dark: '#BF2600',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FF8B00',
    light: '#FFAB00',
    dark: '#FF6B35',
    contrastText: '#000000',
  },
  info: {
    main: '#0065FF',
    light: '#4C9AFF',
    dark: '#0052CC',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#36B37E',
    light: '#57D9A3',
    dark: '#006644',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#FAFBFC',
    100: '#F4F5F7',
    200: '#EBECF0',
    300: '#DFE1E6',
    400: '#C1C7D0',
    500: '#B3BAC5',
    600: '#A5ADBA',
    700: '#97A0AF',
    800: '#8993A4',
    900: '#7A869A',
    A100: '#F4F5F7',
    A200: '#EBECF0',
    A400: '#C1C7D0',
    A700: '#97A0AF',
  },
};

// SecureSync Pro specific colors
const secureSyncColors = {
  security: {
    main: '#FF5630',
    light: '#FF7452',
    dark: '#DE350B',
    contrastText: '#FFFFFF',
  },
  encryption: {
    main: '#6554C0',
    light: '#8777D9',
    dark: '#5243AA',
    contrastText: '#FFFFFF',
  },
  ai: {
    main: '#00B8D9',
    light: '#79E2F2',
    dark: '#008DA6',
    contrastText: '#FFFFFF',
  },
  recording: {
    main: '#FF8B00',
    light: '#FFAB00',
    dark: '#FF6B35',
    contrastText: '#000000',
  },
};

// Base theme configuration
const baseTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    ...atlassianColors,
    background: {
      default: '#FAFBFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#172B4D',
      secondary: '#5E6C84',
      disabled: '#A5ADBA',
    },
    divider: '#DFE1E6',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: 0,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#5E6C84',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 1px rgba(9, 30, 66, 0.25)',
    '0px 1px 1px rgba(9, 30, 66, 0.25)',
    '0px 2px 4px rgba(9, 30, 66, 0.25)',
    '0px 4px 8px rgba(9, 30, 66, 0.25)',
    '0px 6px 12px rgba(9, 30, 66, 0.25)',
    '0px 8px 16px rgba(9, 30, 66, 0.25)',
    '0px 12px 24px rgba(9, 30, 66, 0.25)',
    '0px 16px 32px rgba(9, 30, 66, 0.25)',
    '0px 24px 48px rgba(9, 30, 66, 0.25)',
    '0px 32px 64px rgba(9, 30, 66, 0.25)',
    '0px 40px 80px rgba(9, 30, 66, 0.25)',
    '0px 48px 96px rgba(9, 30, 66, 0.25)',
    '0px 56px 112px rgba(9, 30, 66, 0.25)',
    '0px 64px 128px rgba(9, 30, 66, 0.25)',
    '0px 72px 144px rgba(9, 30, 66, 0.25)',
    '0px 80px 160px rgba(9, 30, 66, 0.25)',
    '0px 88px 176px rgba(9, 30, 66, 0.25)',
    '0px 96px 192px rgba(9, 30, 66, 0.25)',
    '0px 104px 208px rgba(9, 30, 66, 0.25)',
    '0px 112px 224px rgba(9, 30, 66, 0.25)',
    '0px 120px 240px rgba(9, 30, 66, 0.25)',
    '0px 128px 256px rgba(9, 30, 66, 0.25)',
    '0px 136px 272px rgba(9, 30, 66, 0.25)',
    '0px 144px 288px rgba(9, 30, 66, 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:focus': {
            boxShadow: '0 0 0 2px rgba(5, 114, 206, 0.5)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
            transition: 'transform 0.2s ease-in-out',
          },
        },
        outlined: {
          borderColor: '#DFE1E6',
          '&:hover': {
            borderColor: '#C1C7D0',
            backgroundColor: '#F4F5F7',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 1px 1px rgba(9, 30, 66, 0.25)',
          border: '1px solid #DFE1E6',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#172B4D',
          boxShadow: '0px 1px 1px rgba(9, 30, 66, 0.25)',
          borderBottom: '1px solid #DFE1E6',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FAFBFC',
          borderRight: '1px solid #DFE1E6',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '& fieldset': {
              borderColor: '#DFE1E6',
            },
            '&:hover fieldset': {
              borderColor: '#C1C7D0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0052CC',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: '#E3FCEF',
          color: '#006644',
          '& .MuiAlert-icon': {
            color: '#36B37E',
          },
        },
        standardError: {
          backgroundColor: '#FFEBE6',
          color: '#BF2600',
          '& .MuiAlert-icon': {
            color: '#DE350B',
          },
        },
        standardWarning: {
          backgroundColor: '#FFFAE6',
          color: '#974F0C',
          '& .MuiAlert-icon': {
            color: '#FF8B00',
          },
        },
        standardInfo: {
          backgroundColor: '#DEEBFF',
          color: '#0747A6',
          '& .MuiAlert-icon': {
            color: '#0065FF',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F4F5F7',
          '& .MuiTableCell-head': {
            color: '#5E6C84',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#F4F5F7',
          },
          '&.Mui-selected': {
            backgroundColor: '#DEEBFF',
            color: '#0052CC',
            '&:hover': {
              backgroundColor: '#B3D4FF',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#DFE1E6',
          color: '#5E6C84',
          fontSize: '0.875rem',
          fontWeight: 600,
        },
      },
    },
  },
};

// Create the theme with custom properties
const theme = createTheme(deepmerge(baseTheme, {
  palette: {
    // Add custom SecureSync colors to the palette
    security: secureSyncColors.security,
    encryption: secureSyncColors.encryption,
    ai: secureSyncColors.ai,
    recording: secureSyncColors.recording,
  },
}));

// Extend the theme type to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    security: Palette['primary'];
    encryption: Palette['primary'];
    ai: Palette['primary'];
    recording: Palette['primary'];
  }

  interface PaletteOptions {
    security?: PaletteOptions['primary'];
    encryption?: PaletteOptions['primary'];
    ai?: PaletteOptions['primary'];
    recording?: PaletteOptions['primary'];
  }
}

// Create dark theme variant
const darkTheme = createTheme(deepmerge(baseTheme, {
  palette: {
    mode: 'dark',
    background: {
      default: '#0D1421',
      paper: '#1D2125',
    },
    text: {
      primary: '#B3BAC5',
      secondary: '#8993A4',
      disabled: '#5E6C84',
    },
    divider: '#A1BDD914',
    ...atlassianColors,
    security: secureSyncColors.security,
    encryption: secureSyncColors.encryption,
    ai: secureSyncColors.ai,
    recording: secureSyncColors.recording,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1D2125',
          color: '#B3BAC5',
          borderBottom: '1px solid #A1BDD914',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0D1421',
          borderRight: '1px solid #A1BDD914',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1D2125',
          border: '1px solid #A1BDD914',
        },
      },
    },
  },
}));

export { theme, darkTheme, atlassianColors, secureSyncColors };
