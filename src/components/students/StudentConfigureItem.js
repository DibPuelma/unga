import { EditOutlined, Event, Fingerprint, PersonAddAlt1Outlined, PersonRemoveOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Checkbox, Divider, Grid, Stack, Typography } from "@mui/material";
import axios from "axios";
import moment from "moment-timezone";
import { useEffect, useMemo, useState } from "react";
import EditOrCreateStudent from "./EditOrCreateStudent";

export default function StudentConfigureItem({ student, onUpdate, onSelect, selected }) {
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationError, setActivationError] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dynamicStudent, setDynamicStudent] = useState({ ...student });
  const checked = useMemo(() => selected, [selected])

  useEffect(() => setDynamicStudent({ ...student }), [student]);

  const id = student.id;

  const handleStudentActivation = async (action) => {
    setActivationLoading(true);
    setActivationError(false);
    try {
      const response = await axios.patch(`/api/students/${id}/activation?action=${action}`);
      onUpdate(response.data)
    } catch (e) {
      console.error(e);
      setActivationError(true);
    } finally {
      setActivationLoading(false);
    }
  };

  if (editMode) return (
    <>
      <Box py={2}>
        <EditOrCreateStudent student={dynamicStudent} onCancel={() => setEditMode(false)} onSave={onUpdate} />
      </Box>
      <Divider />
    </>
  )

  return (
    <Box width="100%">
      <Grid container py={{ xs: 2, sm: 1 }} px={1} justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center">
          {onSelect && (
            <Checkbox onChange={() => onSelect(student.id)} checked={checked} />
          )}
          <Stack justifyContent="space-between">
            <Typography>{dynamicStudent.fullName || `${dynamicStudent.firstName} ${dynamicStudent.lastName}`}</Typography>
            {dynamicStudent.birthDate && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Event fontSize='10px' />
                <Typography variant="caption">{moment(dynamicStudent.birthDate).format('DD [de] MMM [de] YYYY')}</Typography>
              </Stack>
            )}
            {dynamicStudent.rut && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Fingerprint fontSize='10px' />
                <Typography variant="caption">{dynamicStudent.rut}</Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="flex-end">
          <Button
            startIcon={<EditOutlined />}
            onClick={() => setEditMode(true)}
          >
            Editar
          </Button>
          {dynamicStudent.deactivatedAt ? (
            <Stack alignItems="flex-end">
              <LoadingButton
                startIcon={<PersonAddAlt1Outlined />}
                onClick={() => handleStudentActivation('ACTIVATE')}
                loading={activationLoading}
                loadingPosition="start"
                disabled={activationLoading}
              >
                Activar
              </LoadingButton>
              {activationError && (
                <Typography color="error" variant="caption">
                  No se pudo activar el párvulo
                </Typography>
              )}
            </Stack>
          ) : (
            <Stack alignItems="flex-end">
              <LoadingButton
                startIcon={<PersonRemoveOutlined />}
                onClick={() => handleStudentActivation('DEACTIVATE')}
                loading={activationLoading}
                loadingPosition="start"
                disabled={activationLoading}
              >
                Desactivar
              </LoadingButton>
              {activationError && (
                <Typography color="error" variant="caption">
                  No se pudo desactivar el párvulo
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Grid>
      <Divider />
    </Box>
  );
}