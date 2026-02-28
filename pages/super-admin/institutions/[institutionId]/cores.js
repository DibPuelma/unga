import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, List, ListItem, ListItemText, Breadcrumbs, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Alert, Snackbar } from "@mui/material";
import { getCores } from "db/core";
import { getObjectivesByInstitution } from "db/objective";
import { getSubObjectivesForInstitution } from "db/subObjectives";
import { isAuthorized } from "services/Authorization";
import { serializeForNextProps } from "src/helpers/businessLogic";
import { getInstitution } from "db/institution";
import Head from "next/head";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { LoadingButton } from "@mui/lab";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { params: { institutionId } } = context;
  const institution = await getInstitution(institutionId);

  if (!institution) {
    return {
      notFound: true,
    };
  }

  const cores = await getCores(institutionId);
  const allObjectives = await getObjectivesByInstitution(institutionId);
  const allSubObjectives = await getSubObjectivesForInstitution(institutionId);

  // Group objectives and subObjectives by core
  const coresWithData = cores.map((core) => {
    const objectives = allObjectives.filter((obj) => obj.coreId === core.id);
    const subObjectives = allSubObjectives.filter((subObj) => subObj.coreId === core.id);

    // Group subObjectives by their parent objective
    const objectivesWithSubObjectives = objectives.map((objective) => {
      const subObjs = subObjectives.filter((subObj) => subObj.objectiveId === objective.id);
      return {
        ...objective,
        subObjectives: subObjs,
      };
    });

    // Group objectives by level, then by curricular objective
    const objectivesByLevel = {};
    const objectivesWithoutCurricularObjective = [];

    objectivesWithSubObjectives.forEach((objective) => {
      if (objective.curricularObjective && objective.curricularObjective.id) {
        // Group by level - if objective has multiple levels, it appears in each level group
        const levels = objective.levels && objective.levels.length > 0 
          ? objective.levels 
          : [{ id: 'no_level', name: 'Sin nivel asignado' }];
        
        levels.forEach((level) => {
          const levelId = level.id;
          const levelName = level.name;
          
          if (!objectivesByLevel[levelId]) {
            objectivesByLevel[levelId] = {
              level: level,
              objectivesByCurricularObjective: {},
            };
          }
          
          const curricularObjectiveId = objective.curricularObjective.id;
          if (!objectivesByLevel[levelId].objectivesByCurricularObjective[curricularObjectiveId]) {
            objectivesByLevel[levelId].objectivesByCurricularObjective[curricularObjectiveId] = {
              curricularObjective: objective.curricularObjective,
              objectives: [],
            };
          }
          
          // Only add if not already in the array (to avoid duplicates when objective has multiple levels)
          const existingObjective = objectivesByLevel[levelId]
            .objectivesByCurricularObjective[curricularObjectiveId]
            .objectives.find((obj) => obj.id === objective.id);
          
          if (!existingObjective) {
            objectivesByLevel[levelId]
              .objectivesByCurricularObjective[curricularObjectiveId]
              .objectives.push(objective);
          }
        });
      } else {
        objectivesWithoutCurricularObjective.push(objective);
      }
    });

    // SubObjectives without a parent objective (shouldn't happen, but handle it)
    const orphanSubObjectives = subObjectives.filter(
      (subObj) => !objectives.some((obj) => obj.id === subObj.objectiveId)
    );

    // Convert to arrays, sorted by level name (with "Sin nivel asignado" at the end)
    const objectivesByLevelArray = Object.values(objectivesByLevel).map((levelGroup) => ({
      level: levelGroup.level,
      objectivesByCurricularObjective: Object.values(levelGroup.objectivesByCurricularObjective),
    })).sort((a, b) => {
      // Sort by level name, with "Sin nivel asignado" at the end
      if (a.level.id === 'no_level') return 1;
      if (b.level.id === 'no_level') return -1;
      return a.level.name.localeCompare(b.level.name);
    });

    return {
      ...core,
      objectivesByLevel: objectivesByLevelArray,
      objectivesWithoutCurricularObjective,
      orphanSubObjectives,
    };
  });

  return {
    props: serializeForNextProps({
      cores: coresWithData,
      institution,
      institutionId,
    }),
  };
}

export default function InstitutionCores({ cores, institution, institutionId }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coreToDelete, setCoreToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleDeleteClick = (core, event) => {
    event.stopPropagation();
    setCoreToDelete(core);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCoreToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!coreToDelete) return;

    setLoading(true);
    try {
      await axios.delete(
        `/api/super-admin/institutions/${institutionId}/cores/${coreToDelete.id}`
      );
      setMessage({ type: 'success', text: 'Núcleo eliminado exitosamente' });
      setOpenSnackbar(true);
      handleCloseDeleteDialog();
      router.reload();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar el núcleo';
      setMessage({ type: 'error', text: errorMessage });
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Núcleos - {institution.name || 'Institución'}</title>
      </Head>
      <Box sx={{ width: '100%' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link href="/super-admin/pmf-answers" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Super Admin</Typography>
          </Link>
          <Link href="/super-admin/institutions" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Instituciones</Typography>
          </Link>
          <Link href={`/super-admin/institutions/${institutionId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">{institution.name || 'Institución'}</Typography>
          </Link>
          <Typography color="text.primary">Núcleos</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Núcleos - {institution.name || 'Institución'}
        </Typography>
        {cores.map((core) => (
          <Accordion key={core.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                <Typography variant="h6">
                  {core.name} {core.type && `(${core.type})`}
                </Typography>
                <IconButton
                  onClick={(e) => handleDeleteClick(core, e)}
                  color="error"
                  size="small"
                  sx={{ ml: 2 }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {core.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {core.description}
                </Typography>
              )}
              {core.objectivesByLevel.length === 0 && core.objectivesWithoutCurricularObjective.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay objetivos para este núcleo
                </Typography>
              ) : (
                <>
                  {/* Objectives grouped by level, then by curricular objective */}
                  {core.objectivesByLevel.map((levelGroup) => (
                    <Box key={levelGroup.level.id} sx={{ mb: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        Nivel: {levelGroup.level.name}
                      </Typography>
                      {levelGroup.objectivesByCurricularObjective.map((curricularGroup) => (
                        <Box key={curricularGroup.curricularObjective.id} sx={{ mb: 2, pl: 2 }}>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                            Objetivo Curricular: {curricularGroup.curricularObjective.name}
                          </Typography>
                          <List>
                            {curricularGroup.objectives.map((objective) => (
                              <ListItem key={objective.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <ListItemText
                                  primary={
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      Objetivo: {objective.name}
                                    </Typography>
                                  }
                                />
                                {objective.subObjectives && objective.subObjectives.length > 0 && (
                                  <Box sx={{ pl: 2, width: '100%' }}>
                                    <Typography variant="body2" gutterBottom>
                                      Sub-objetivos:
                                    </Typography>
                                    <List dense>
                                      {objective.subObjectives.map((subObj) => (
                                        <ListItem key={subObj.id}>
                                          <ListItemText
                                            primary={subObj.name}
                                            secondary={subObj.position ? `Posición: ${subObj.position}` : null}
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                )}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ))}
                    </Box>
                  ))}
                  {/* Objectives without curricular objective */}
                  {core.objectivesWithoutCurricularObjective.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                        Objetivos sin Objetivo Curricular
                      </Typography>
                      <List>
                        {core.objectivesWithoutCurricularObjective.map((objective) => (
                          <ListItem key={objective.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight="bold">
                                  Objetivo: {objective.name}
                                </Typography>
                              }
                            />
                            {objective.subObjectives && objective.subObjectives.length > 0 && (
                              <Box sx={{ pl: 2, width: '100%' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Sub-objetivos:
                                </Typography>
                                <List dense>
                                  {objective.subObjectives.map((subObj) => (
                                    <ListItem key={subObj.id}>
                                      <ListItemText
                                        primary={subObj.name}
                                        secondary={subObj.position ? `Posición: ${subObj.position}` : null}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </>
              )}
              {core.orphanSubObjectives && core.orphanSubObjectives.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sub-objetivos sin objetivo padre:
                  </Typography>
                  <List dense>
                    {core.orphanSubObjectives.map((subObj) => (
                      <ListItem key={subObj.id}>
                        <ListItemText primary={subObj.name} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Eliminar Núcleo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el núcleo "{coreToDelete?.name}"?
            <br />
            <br />
            Esta acción eliminará el núcleo y marcará como eliminados todos los objetivos y sub-objetivos asociados.
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <LoadingButton
            loading={loading}
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={message.type === 'error' ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </>
  );
}

