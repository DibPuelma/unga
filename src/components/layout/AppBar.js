import React, { useContext, useEffect, useMemo, useState } from 'react';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/router'
import {
  AppBar as MuiAppBar,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
} from '@mui/material';
import { ArrowBackIos, Menu as MenuIcon } from '@mui/icons-material';
import { signOut } from 'next-auth/react';
import { UserContext } from 'src/context/UserContext';
import { MixpanelContext } from 'services/MixpanelContext';

export default function UngaAppBar({ toggleDrawer, drawerWidth, drawerOpen }) {
  const { clearContext, userHasPlan, user: { role } } = useContext(UserContext);
  const { trackLogout } = useContext(MixpanelContext);
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const AppBar = mdUp ? styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
  })(({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeIn,
      duration: theme.transitions.duration.standard,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeIn,
        duration: theme.transitions.duration.standard,
      }),
    }),
  })) : MuiAppBar;

  const router = useRouter();
  const [title, setTitle] = useState('');
  const withBackArrow = useMemo(() => Object.keys(router.components).length > 2, [router]);

  const handleTitleChange = () => {
    setTitle(document.querySelector('title').innerText);
  }

  useEffect(() => {
    handleTitleChange();
  }, [])

  useEffect(() => new MutationObserver(function (mutations) {
    handleTitleChange();
  }).observe(
    document.querySelector('title'),
    { subtree: true, characterData: true, childList: true }
  ), []);

  const handleLogout = async (e) => {
    clearContext();
    // trackLogout();
    await signOut({ callbackUrl: '/auth/login' });
  };

  if (!userHasPlan) {
    return (
      <AppBar
        open={false}
        id="app-bar"
        position="fixed"
        sx={{ borderRadius: 0 }}
      >
        <Toolbar variant="dense">
          <Stack
            direction="row"
            width="100%"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant={mdUp ? 'h6' : 'body2'}
              component="div"
              textAlign={mdUp ? 'center' : 'left'}
              color="white"
            >
              {title}
            </Typography>
            <Button onClick={handleLogout} sx={{ color: 'white' }}>Cerrar sesión</Button>
          </Stack>
        </Toolbar>
      </AppBar>
    )
  }

  return (
    <AppBar
      open={drawerOpen}
      id="app-bar"
      position="fixed"
      sx={{ borderRadius: 0 }}
    >
      <Toolbar variant="dense">
        <Stack
          direction="row"
          width="100%"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          {withBackArrow && (
            <IconButton
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              color="inherit"
              onClick={() => router.back()}
              aria-label="back arrow"
            >
              <ArrowBackIos sx={{ color: 'white' }} />
            </IconButton>
          )}
          {!drawerOpen && (
            <IconButton
              onClick={toggleDrawer}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              id="desktop-menu-button"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            width="100%"
            variant={mdUp ? 'h6' : 'body2'}
            component="div"
            textAlign={mdUp ? 'center' : 'left'}
            color="white"
          >
            {title}
          </Typography>
          <IconButton
            onClick={toggleDrawer}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            id="mobile-menu-button"
          >
            <MenuIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
/* <Menu
  sx={{ mt: 1 }}
  id="user-menu"
  anchorEl={anchorEl}
  open={open}
  onClose={closeMenu}
  MenuListProps={{
    'aria-labelledby': 'avatar',
  }}
>
  <MenuItem onClick={goToProfile}>
    <ListItemIcon>
      <AccountCircle fontSize="small" />
    </ListItemIcon>
    <ListItemText>Mi perfil</ListItemText>
  </MenuItem>
  <MenuItem onClick={handleLogout}>
    <ListItemIcon>
      <Logout fontSize="small" />
    </ListItemIcon>
    <ListItemText>Cerrar sesión</ListItemText>
  </MenuItem>
</Menu> */