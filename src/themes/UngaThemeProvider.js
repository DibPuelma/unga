import { ThemeProvider } from '@mui/material/styles';
import ungaTheme from './ungaTheme';

export default function UngaThemeProvider({ children }) {
  return (
    <ThemeProvider theme={ungaTheme}>
      {children}
    </ThemeProvider>
  )
}