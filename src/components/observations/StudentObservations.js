import { useRouter } from 'next/router';
import ObservationsList from './ObservationsList';
import { Stack, Typography } from '@mui/material';
import CreateObservationButton from './CreateObservationButton';

export default function StudentObservations({ student, observations }) {
  const { query: { classroomId } } = useRouter();
  
  return (
    <ObservationsList
      emptyText={
        <Stack alignItems="center" spacing={2}>
          <Typography textAlign="center">No hay observaciones para {student.fullName}</Typography>
          <CreateObservationButton classroomId={classroomId} studentId={student.id} />
        </Stack>
      }
      observations={observations}
      columns={{ xs: 1, sm: 2, md: 3, xl: 4 }}
      printable
    />
  );
};
