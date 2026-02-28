import { Close, ChevronLeft, ChevronRight, ExpandMore } from "@mui/icons-material";
import { Box, Drawer, IconButton, Stack } from "@mui/material";
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  [theme.breakpoints.up('sm')]: {
    justifyContent: 'flex-start',
  },
}));

export default function UngaPersistentDrawer({ open, width, height, onClose, children }) {
  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up('sm'));
  return (
    <Drawer
      sx={{
        marginTop: '50px',
        width: width,
        height: height,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          borderRadius: 0,
          width: width,
          height: height,
          boxSizing: 'border-box',
        },
      }}
      open={open}
      variant="persistent"
      anchor={upSm ? 'right' : 'bottom'}
    >
      <DrawerHeader>
        <IconButton onClick={onClose}>
          {upSm ? <ChevronRight /> : <ExpandMore /> }
        </IconButton>
      </DrawerHeader>
      <Box sx={{ p: '1rem' }}>
        {children}
      </Box>
    </Drawer>
  )
}