import { styled } from '@mui/material/styles';
import UngaPersistentDrawer from './UngaPersistentDrawer';

const drawerWidth = 35;
const drawerHeight = 45;

export default function UngaMain({
  open,
  mainChildren,
  drawerChildren,
  onClose,
  marginClosed = drawerWidth,
  marginOpen = -4,
  marginMobile= -4,
}) {

  const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
      [theme.breakpoints.down('sm')]: {
        marginRight: `${marginMobile}vw`,
        ...(open && {
          transition: theme.transitions.create('height', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflow: 'scroll',
        }),
      },
      [theme.breakpoints.up('sm')]: {
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        marginRight: `-${marginClosed}vw`,
        ...(open && {
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginRight: `${marginOpen}vw`,
        }),
      }
    }),
  );

  return (
    <>
      <Main open={open}>
        {mainChildren}
      </Main>
      {open && (
        <UngaPersistentDrawer
          open={open}
          onClose={onClose}
          width={{ xs: '100%', sm: `${drawerWidth}vw` }}
          height={{ xs: `${drawerHeight}vh`, sm: '100%' }}
        >
          {drawerChildren}
        </UngaPersistentDrawer>
      )}
    </>
  )
}