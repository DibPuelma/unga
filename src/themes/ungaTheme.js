import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#fb9f71',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#9fbfd5',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: "#e5ebf0"
    }
  },
  typography: {
    fontFamily: [
      '"Poppins"',
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
      fontFamily: '"Poppins", sans-serif',
      color: '#575757',
    },
    h2: {
      fontFamily: '"Poppins", sans-serif',
      color: '#575757',
    },
    h3: {
      fontFamily: '"Poppins", sans-serif',
      color: '#575757',
    },
    h4: {
      fontFamily: '"Poppins", sans-serif',
      color: '#575757',
    },
    h5: {
      fontFamily: '"Poppins", sans-serif',
      color: '#575757',
    },
    h6: {
      fontFamily: '"Poppins", sans-serif',
      color: '#575757',
    },
    subtitle1: {
      fontFamily: 'Poppins',
    },
    subtitle2: {
      fontFamily: 'Poppins',
    },
    body1: {
      fontFamily: 'Poppins',
    },
    body2: {
      fontFamily: 'Poppins',
    },
    caption: {
      fontFamily: 'Poppins',
    },
    button: {
      fontFamily: 'Poppins',
      textTransform: 'none',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&:before': {
            height: 0,
          },
        },
      },
    },
  },
});

export default responsiveFontSizes(theme);
