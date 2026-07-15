import { styled, useTheme } from '@mui/material/styles';
import {
  AccountCircleOutlined,
  OndemandVideoOutlined,
  AutoGraph,
  AutoStoriesOutlined,
  EventAvailable,
  ExpandLess,
  ExpandMore,
  InsertEmoticon,
  Grading,
  Logout,
  SchoolOutlined,
  SettingsOutlined,
  Today,
  VisibilityOutlined,
  WhatsApp,
  StarOutline,
  CardGiftcardOutlined,
  ChevronLeftOutlined,
  AttachMoneyOutlined,
  SmartToyOutlined,
  Close,
  LockOutlined,
} from "@mui/icons-material";
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
} from "@mui/material";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import React, { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import { AdvancedReportContext } from "src/context/AdvancedReportContext";
import { UserContext } from "src/context/UserContext";
import { ascendingSort } from "src/helpers/arrays";
import { getViewAccessClassrooms } from "src/helpers/businessLogic";
import ReferralsTour from '../tours/Referrals';
import { ACTIONS, STATUS } from 'react-joyride';
import Link from 'src/Link';
import usePlans from 'src/hooks/usePlans';
import usePlanUpgradeWarning from 'src/hooks/usePlanUpgradeWarning';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  justifyContent: 'flex-end',
}));

export default function AppMenu({ institution, user, width, open, toggleDrawer, userHasPlan }) {
  const router = useRouter();
  const {
    plansFromIndividualGrow,
    plansFromIndividualStandOut,
  } = usePlans();
  const { clearContext, setSelectedClassroom, finishTour } = useContext(UserContext);
  const { trackLogout } = useContext(MixpanelContext);
  const { printing } = useContext(AdvancedReportContext);
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const anchor = mdUp ? 'left' : 'right';
  const variant = mdUp ? 'persistent' : 'temporary';
  const [collapseOpen, setCollapseOpen] = useState({});
  const [submenuCollapseOpen, setSubmenuCollapseOpen] = useState({});

  const institutionId = institution?.id;

  const allowedClassrooms = institution?.classrooms ? getViewAccessClassrooms(user, institution.classrooms) : [];

  useEffect(() => {
    if (user && !user.finishedReferralsTour && !open && userHasPlan && mdUp && user.finishedTour && !user.role.includes('Admin')) toggleDrawer({});
  }, [user]);

  const handleCollapseOpen = (_, key) => {
    setCollapseOpen({ [key]: !collapseOpen[key] });
  }

  const handleSubmenuCollapseOpen = (_, key) => {
    setSubmenuCollapseOpen({ [key]: !submenuCollapseOpen[key] });
  };

  const handleLogout = async (e) => {
    toggleDrawer(e);
    clearContext();
    // trackLogout();
    await signOut({ callbackUrl: '/auth/login' });
  };

  const handleSelectClassroom = (classroomId) => {
    const classroom = allowedClassrooms.find((c) => c.id === classroomId);
    setSelectedClassroom(classroom);
  }

  const goToProfile = (e) => {
    toggleDrawer(e);
    router.push(`/users/${user.id}/profile`)
  };

  const goToPlan = (e) => {
    toggleDrawer(e);
    router.push(`/users/${user.id}/current-plan`)
  };

  const goToHelp = (e) => {
    toggleDrawer(e);
    router.push(`/help`)
  };

  const goToStudents = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/students`);
  };

  const goToCores = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/cores`);
  }

  const goToCore = (e, classroomId, coreId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/cores/${coreId}`);
  };

  const goToLessonPlan = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/lesson-plan`);
  };

  const goToProgress = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/progress`);
  };

  const goToClassroomObservations = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/observations`);
  };

  const goToClassroomConfigure = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/institutions/${institutionId}/classrooms/${classroomId}/configure`);
  }
  const goToClassroomAttendance = (e, classroomId) => {
    handleSelectClassroom(classroomId);
    toggleDrawer(e);
    router.push(`/classes/${classroomId}/attendance`);
  }

  const goToActivityLibrary = (e) => {
    toggleDrawer(e);
    router.push(`/institutions/${institutionId}/activities`)
  };

  const goToPrincipalIndex = (e) => {
    toggleDrawer(e)
    router.push(`/institutions/${institutionId}`)
  }

  const goToInstitutionConfig = (e) => {
    toggleDrawer(e);
    router.push(`/institutions/${institutionId}/configuration`)
  }

  const goToTutorials = (e) => {
    toggleDrawer(e);
    router.push(`/tutorials`);
  }

  const goToCommunity = (e) => {
    toggleDrawer(e);
    router.push(`/community/educators-ranking`);
  }

  const goToOnboarding = (e) => {
    toggleDrawer(e);
    router.push(`/users/onboarding`);
  }

  const goToReferrals = (e) => {
    toggleDrawer(e);
    router.push(`/users/${user.id}/referrals`);
  }

  const goToCreateFromAI = (e) => {
    toggleDrawer(e);
    router.push(`/institutions/${institutionId}/activities/create-from-ai`);
  }

  const steps = [
    {
      target: '#referrals-link',
      content: 'Puedes ganar plata invitando a tus colegas a usar la plataforma, solo debes compartir un link. ¡Haz click aquí para saber cómo!',
      disableBeacon: true,
    },
  ]

  const handleJoyrideCallback = (data) => {
    const { status, type, action } = data;
    if (status === STATUS.FINISHED && type === 'tour:end' && action === ACTIONS.NEXT) {
      finishTour('finishedReferralsTour');
    }
  }

  function ListItemButtonConsideringPlan({ plansWithAccess, icon, title, onClick }) {
    const handleNeedsToUpgrade = usePlanUpgradeWarning();

    if (plansWithAccess.includes(user.plan)) {
      return (
        <ListItemButton onClick={onClick}>
          {icon && (
            <ListItemIcon>
              {icon}
            </ListItemIcon>
          )}
          <ListItemText>{title}</ListItemText>
        </ListItemButton>
      )
    }
    return (
      <ListItemButton onClick={handleNeedsToUpgrade}>
        <ListItemIcon>
          <LockOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText>{title}</ListItemText>
      </ListItemButton>
    )
  }

  return (
    <>
      <ReferralsTour
        steps={steps}
        callback={handleJoyrideCallback}
        locale={{
          last: 'Entendido',
        }}
      />
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
          },
        }}
      >
        <DrawerHeader>
          <IconButton size="large" onClick={toggleDrawer}>
            <ChevronLeftOutlined />
          </IconButton>
        </DrawerHeader>
        <Box
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            flex: 1,
            minHeight: 0,
          }}
        >
        {user.role === 'superAdmin' && (
          <List sx={{ pb: 10, pt: 0 }}>
            <ListItemButton href="/super-admin/pmf-answers">
              <ListItemText>PMF</ListItemText>
            </ListItemButton>
            <ListItemButton href="/super-admin/conversion-funnel">
              <ListItemText>Funnel de conversión</ListItemText>
            </ListItemButton>
            <ListItemButton href="/super-admin/referrals">
              <ListItemText>Referrals</ListItemText>
            </ListItemButton>
            <ListItemButton href="/super-admin/activities-to-parents">
              <ListItemText>Actividades para padres</ListItemText>
            </ListItemButton>
            <ListItemButton href="/super-admin/institutions">
              <ListItemText>Instituciones</ListItemText>
            </ListItemButton>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>Cerrar sesión</ListItemText>
            </ListItemButton>
          </List>
        )}
        {user.role !== 'superAdmin' && (
          <List sx={{ pb: 10, pt: 0 }}>
            {institution && (
              <>
                <ListItemButton id="referrals-link" onClick={goToReferrals}>
                  <ListItemIcon>
                    <AttachMoneyOutlined />
                  </ListItemIcon>
                  <ListItemText>Invita y gana</ListItemText>
                </ListItemButton>
                {/* {user.role === 'principal' && (
            <ListItemButton onClick={goToPrincipalIndex}>
              <ListItemIcon>
                <AutoGraph />
              </ListItemIcon>
              <ListItemText>Panel de directora</ListItemText>
            </ListItemButton>
          )} */}
                <ListItemButton onClick={goToActivityLibrary}>
                  <ListItemIcon>
                    <AutoStoriesOutlined />
                  </ListItemIcon>
                  <ListItemText>Biblioteca de experiencias</ListItemText>
                </ListItemButton>
                {institution.features?.includes('createActivitiesFromAI') && (
                  <ListItemButton onClick={goToCreateFromAI}>
                    <ListItemIcon>
                      <SmartToyOutlined />
                    </ListItemIcon>
                    <ListItemText>Creación con GPT</ListItemText>
                  </ListItemButton>
                )}
                <ListItemButton onClick={goToTutorials}>
                  <ListItemIcon>
                    <OndemandVideoOutlined />
                  </ListItemIcon>
                  <ListItemText>Tutoriales</ListItemText>
                </ListItemButton>
                <ListItemButton onClick={goToInstitutionConfig}>
                  <ListItemIcon>
                    <SettingsOutlined />
                  </ListItemIcon>
                  <ListItemText>Configuración general</ListItemText>
                </ListItemButton>
              </>
            )}
            {allowedClassrooms?.length > 0 && (
              <>
                <ListSubheader>Tus salas</ListSubheader>
                {allowedClassrooms.map((classroom) => {
                  const { name, level: { name: levelName }, id: classroomId } = classroom;
                  const showLevel = name !== levelName;
                  return (
                    <React.Fragment key={classroomId}>
                      <ListItemButton onClick={(e) => handleCollapseOpen(e, classroomId)}>
                        <ListItemIcon>
                          <SchoolOutlined />
                        </ListItemIcon>
                        <ListItemText primary={name} secondary={showLevel && levelName} />
                        {collapseOpen[classroomId] ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={collapseOpen[classroomId]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 2 }}>
                          <ListItemButton onClick={(e) => handleSubmenuCollapseOpen(e, 'Planificaciones')}>
                            <ListItemIcon>
                              <Today fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Planificaciones" />
                            {submenuCollapseOpen['Planificaciones'] ? <ExpandLess /> : <ExpandMore />}
                          </ListItemButton>
                          <Collapse in={submenuCollapseOpen['Planificaciones']} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2 }}>
                              <ListItemButtonConsideringPlan
                                onClick={(e) => goToLessonPlan(e, classroomId)}
                                title="Calendario"
                                plansWithAccess={plansFromIndividualGrow}
                              />
                              <ListItemButtonConsideringPlan
                                onClick={(e) => goToProgress(e, classroomId)}
                                title="Avance"
                                plansWithAccess={plansFromIndividualGrow}
                              />
                            </List>
                          </Collapse>
                          <ListItemButtonConsideringPlan
                            onClick={(e) => goToClassroomObservations(e, classroomId)}
                            title="Registro de observación"
                            icon={<VisibilityOutlined fontSize="small" />}
                            plansWithAccess={plansFromIndividualGrow}
                          />
                          <ListItemButton onClick={(e) => handleSubmenuCollapseOpen(e, 'Evaluaciones')}>
                            <ListItemIcon>
                              <Grading fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Evaluaciones" />
                            {submenuCollapseOpen['Evaluaciones'] ? <ExpandLess /> : <ExpandMore />}
                          </ListItemButton>
                          <Collapse in={submenuCollapseOpen['Evaluaciones']} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2 }}>
                              <ListItemButtonConsideringPlan
                                onClick={(e) => goToCores(e, classroomId)}
                                title="Resultados generales"
                                plansWithAccess={plansFromIndividualGrow}
                              />
                              {[...institution.cores.filter((core) => !core.hide)]
                                .sort((a, b) => {
                                  if (a.position === null && b.position === null) return 0;
                                  if (a.position === null) return 1;
                                  if (b.position === null) return -1;
                                  return (a.position || 0) - (b.position || 0);
                                })
                                .map((core) => {
                                  const coreId = core.id;
                                  return (
                                    <Fragment key={coreId}>
                                      <ListItemButtonConsideringPlan
                                        onClick={(e) => goToCore(e, classroomId, coreId)}
                                        title={core.name}
                                        plansWithAccess={plansFromIndividualGrow}
                                      />
                                    </Fragment>
                                  )
                                })}
                            </List>
                          </Collapse>
                          <ListItemButtonConsideringPlan
                            onClick={(e) => goToStudents(e, classroomId)}
                            title="Informes y párvulos"
                            icon={<InsertEmoticon fontSize="small" />}
                            plansWithAccess={plansFromIndividualGrow}
                          />
                          <ListItemButtonConsideringPlan
                            icon={<EventAvailable fontSize="small" />}
                            onClick={(e) => goToClassroomAttendance(e, classroomId)}
                            title="Asistencia"
                            plansWithAccess={plansFromIndividualStandOut}
                          />
                          <ListItemButton onClick={(e) => goToClassroomConfigure(e, classroomId)}>
                            <ListItemIcon>
                              <SettingsOutlined fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Configuraciones</ListItemText>
                          </ListItemButton>
                        </List>
                      </Collapse>
                    </React.Fragment>
                  )
                })}
              </>
            )}
            {/* {user.role !== 'parent' && (
              <>
                <ListSubheader>Comunidad</ListSubheader>
                <ListItemButton onClick={goToCommunity}>
                  <ListItemIcon>
                    <StarOutline />
                  </ListItemIcon>
                  <ListItemText>Profesionales destacadas</ListItemText>
                </ListItemButton>
              </>
            )} */}
            <ListSubheader>Tu usuario</ListSubheader>
            <ListItemButton onClick={goToProfile}>
              <ListItemIcon>
                <AccountCircleOutlined />
              </ListItemIcon>
              <ListItemText>Tu perfil</ListItemText>
            </ListItemButton>
            {userHasPlan && user.role === 'parent' && (
              <Link
                href={`https://wa.me/447543814676?text=Quiero cancelar mi suscripción a Unga, mi correo es ${user.email}`}
                target="_blank"
                rel="noopener noreferrer"
                noLinkStyle
              >
                <ListItemButton onClick={goToPlan}>
                  <ListItemIcon>
                    <Close />
                  </ListItemIcon>
                  <ListItemText>Cancelar mi plan</ListItemText>
                </ListItemButton>
              </Link>
            )}
            {userHasPlan && user.role === 'teacher' && user.plan !== 'institutional' && (
              <ListItemButton onClick={goToPlan}>
                <ListItemIcon>
                  <CardGiftcardOutlined />
                </ListItemIcon>
                <ListItemText>Tu plan</ListItemText>
              </ListItemButton>
            )}
            <ListItemButton onClick={goToHelp}>
              <ListItemIcon>
                <WhatsApp />
              </ListItemIcon>
              <ListItemText>Contáctanos</ListItemText>
            </ListItemButton>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>Cerrar sesión</ListItemText>
            </ListItemButton>
          </List>
        )}
        </Box>
      </Drawer >
    </>
  );
};