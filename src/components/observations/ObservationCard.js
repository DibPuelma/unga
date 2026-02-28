import React, { useContext, useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Close, EditOutlined } from '@mui/icons-material';
import AssetShowcase from '../assets/AssetShowcase';
import { isEmpty } from '../../helpers/objects';
import { arrayToListText } from '../../helpers/arrays';
import { getObservationDateTime } from './helpers';
import Link from 'src/Link';
import DeleteObservationButton from './DeleteObservationButton';
import { AdvancedReportContext } from 'src/context/AdvancedReportContext';
import { UserContext } from 'src/context/UserContext';

export default function ObservationCard({
  observation,
  onSelect,
  onRemove,
  checked,
  noName = false,
  noActions = false,
  report = false,
}) {
  const {
    id,
    students,
    description,
    core,
    teacher,
    createdAt,
    observedAt,
    assets,
    classroom,
  } = observation;
  const { printing } = useContext(AdvancedReportContext);
  const { user } = useContext(UserContext);
  const canEdit = useMemo(() => teacher?.id === user.id, [teacher, user]);
  const classroomId = useMemo(() => classroom?.id || classroom?.id, [classroom])
  
  if (report) {
    return (
      <Grid item xs={1}>
        <Stack direction="row" spacing={2}>
          {!printing && (
            <IconButton onClick={() => onRemove(id)}>
              <Close color="error" />
            </IconButton>
          )}
          <Box mt={1}>
            <Typography variant="body2">{description}</Typography>
            <Typography variant="caption" lineHeight={1} color="gray">
              {`${teacher?.firstName} ${teacher?.lastName} el ${getObservationDateTime(observedAt, createdAt)}`}
            </Typography>
          </Box>
        </Stack>
      </Grid>
    )
  }

  return (
    <Grid item xs={1} width="100%">
      <Paper elevation={4} sx={{ p: 2, mb: 1, height: '100%' }}>
        <Stack justifyContent="space-between" height="100%">
          <Stack>
            <Stack direction="row" alignItems="center">
              {onSelect && <Checkbox
                checked={checked}
                onChange={(event) => onSelect(event.target.checked, observation)}
                inputProps={{ 'aria-label': 'controlled' }}
              />}
              {!noName && (
                <Typography variant="subtitle2" color="gray">
                  {arrayToListText(students.map((student) => (
                    `${student.firstName} ${student.lastName}`
                  )))}
                </Typography>
              )}
            </Stack>
            <Box mt={1}>
              <Typography variant="body2">{description}</Typography>
            </Box>
            {!isEmpty(assets) && (
              <Box mt={2}>
                <AssetShowcase assets={assets} thumbnails />
              </Box>
            )}
            <Box mt={1} lineHeight={1}>
              {core?.name && (
                <Typography variant="caption" display="inline" color="primary" lineHeight={1}>{core.name}</Typography>
              )}
            </Box>
            <Box mt={1} lineHeight={1}>
              <Typography variant="caption" lineHeight={1} color="gray">
                {`${teacher?.firstName} ${teacher?.lastName} el ${getObservationDateTime(observedAt, createdAt)}`}
              </Typography>
            </Box>
          </Stack>
          {!noActions && canEdit && (
            <Stack direction="row" justifyContent="flex-end" width="100%" spacing={2}>
              <Link noLinkStyle href={`/classes/${classroomId}/observations/${id}/edit`}>
                <Button variant="outlined" startIcon={<EditOutlined />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  Editar
                </Button>
                <IconButton color="primary" sx={{ display: { sm: 'none' } }}>
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Link>
              <DeleteObservationButton id={id} onDelete={onRemove} />
            </Stack>
          )}
        </Stack>
      </Paper>
    </Grid>
  )
}