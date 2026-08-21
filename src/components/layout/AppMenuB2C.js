import React, { useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import {
  Box,
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  useMediaQuery,
} from '@mui/material';
import {
  AccountCircleOutlined,
  AttachMoneyOutlined,
  AutoAwesome,
  Bolt,
  CalendarMonthOutlined,
  ChevronLeftOutlined,
  ExpandLess,
  ExpandMore,
  LibraryBooksOutlined,
  Logout,
  OndemandVideoOutlined,
  WhatsApp,
} from '@mui/icons-material';
import { signOut } from 'next-auth/react';
import { UserContext } from 'src/context/UserContext';
import { AdvancedReportContext } from 'src/context/AdvancedReportContext';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Flat menu for B2C educators: AI experiences at the center, no per-classroom
// accordion, no evaluations/reports/attendance (not sold to this segment).
export default function AppMenuB2C({ institution, user, width, open, toggleDrawer }) {
  const router = useRouter();
  const { clearContext } = useContext(UserContext);
  const { printing } = useContext(AdvancedReportContext);
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const anchor = mdUp ? 'left' : 'right';
  const variant = mdUp ? 'persistent' : 'temporary';
  const [planningOpen, setPlanningOpen] = useState(false);

  const institutionId = institution?.id;
  const classrooms = useMemo(() => institution?.classrooms || [], [institution]);

  const navigate = (e, path) => {
    toggleDrawer(e);
    router.push(path);
  };

  const handleLogout = async () => {
    clearContext();
    await signOut({ callbackUrl: '/auth/login' });
  };

  const handlePlanningClick = (e) => {
    if (classrooms.length === 1) {
      navigate(e, `/classes/${classrooms[0].id}/lesson-plan`);
    } else {
      setPlanningOpen((v) => !v);
    }
  };

  return (
    <Drawer
      id="app-menu"
      anchor={anchor}
      open={open && !printing}
      onClose={toggleDrawer}
      variant={variant}
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          borderRadius: mdUp ? 0 : '8px',
          width,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        },
      }}
    >
      <DrawerHeader>
        <IconButton size="large" onClick={toggleDrawer}>
          <ChevronLeftOutlined />
        </IconButton>
      </DrawerHeader>
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0 }}>
        <List sx={{ pb: 10, pt: 0 }}>
          {institutionId && (
            <>
              <ListItemButton onClick={(e) => navigate(e, `/institutions/${institutionId}/activities/create`)}>
                <ListItemIcon><AutoAwesome color="primary" /></ListItemIcon>
                <ListItemText>Crear con IA</ListItemText>
              </ListItemButton>
              <ListItemButton onClick={(e) => navigate(e, `/institutions/${institutionId}/activities`)}>
                <ListItemIcon><LibraryBooksOutlined /></ListItemIcon>
                <ListItemText>Mis experiencias</ListItemText>
              </ListItemButton>
              {classrooms.length > 0 && (
                <>
                  <ListItemButton onClick={handlePlanningClick}>
                    <ListItemIcon><CalendarMonthOutlined /></ListItemIcon>
                    <ListItemText>Planificación semanal</ListItemText>
                    {classrooms.length > 1 && (planningOpen ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>
                  {classrooms.length > 1 && (
                    <Collapse in={planningOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {classrooms.map((classroom) => (
                          <ListItemButton
                            key={classroom.id}
                            sx={{ pl: 4 }}
                            onClick={(e) => navigate(e, `/classes/${classroom.id}/lesson-plan`)}
                          >
                            <ListItemText>{classroom.name}</ListItemText>
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </>
              )}
            </>
          )}
          <ListItemButton onClick={(e) => navigate(e, `/users/${user.id}/current-plan`)}>
            <ListItemIcon><Bolt /></ListItemIcon>
            <ListItemText>Créditos y plan</ListItemText>
          </ListItemButton>
          <ListItemButton id="referrals-link" onClick={(e) => navigate(e, `/users/${user.id}/referrals`)}>
            <ListItemIcon><AttachMoneyOutlined /></ListItemIcon>
            <ListItemText>Invita y gana</ListItemText>
          </ListItemButton>
          <ListItemButton onClick={(e) => navigate(e, '/tutorials')}>
            <ListItemIcon><OndemandVideoOutlined /></ListItemIcon>
            <ListItemText>Tutoriales</ListItemText>
          </ListItemButton>

          <ListSubheader>Tu usuario</ListSubheader>
          <ListItemButton onClick={(e) => navigate(e, `/users/${user.id}/profile`)}>
            <ListItemIcon><AccountCircleOutlined /></ListItemIcon>
            <ListItemText>Tu perfil</ListItemText>
          </ListItemButton>
          <ListItemButton onClick={(e) => navigate(e, '/help')}>
            <ListItemIcon><WhatsApp /></ListItemIcon>
            <ListItemText>Contáctanos</ListItemText>
          </ListItemButton>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText>Cerrar sesión</ListItemText>
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
