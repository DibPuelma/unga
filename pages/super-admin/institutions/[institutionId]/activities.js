import { Box, Breadcrumbs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip } from "@mui/material";
import { getActivitiesByInstitution } from "db/activity";
import { isAuthorized } from "services/Authorization";
import { serializeForNextProps } from "src/helpers/businessLogic";
import { getInstitution } from "db/institution";
import Head from "next/head";
import moment from "moment-timezone";
import Link from "next/link";

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

  // Use a large pageSize to get all activities
  const activities = await getActivitiesByInstitution(institutionId, 10000);

  const rows = activities.map((activity) => ({
    id: activity.id,
    name: activity.name || 'Sin nombre',
    description: activity.description || '-',
    creator: activity.creator
      ? `${activity.creator.firstName || ''} ${activity.creator.lastName || ''}`.trim() || activity.creator.email || '-'
      : '-',
    createdAt: moment(activity.createdAt).format('YYYY-MM-DD'),
    theme: activity.theme?.name || '-',
    cores: activity.cores?.map((c) => c.name) || [],
    objectives: activity.objectives?.map((o) => o.name) || [],
  }));

  return {
    props: serializeForNextProps({
      rows,
      institution,
      institutionId,
    }),
  };
}

export default function InstitutionActivities({ rows, institution, institutionId }) {
  return (
    <>
      <Head>
        <title>Actividades - {institution.name || 'Institución'}</title>
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
          <Typography color="text.primary">Actividades</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Actividades - {institution.name || 'Institución'}
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Creador</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Tema</TableCell>
                <TableCell>Núcleos</TableCell>
                <TableCell>Objetivos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id} hover>
                  <TableCell>{index + 1}.- {row.name}</TableCell>
                  <TableCell>
                    {row.description && row.description.length > 100
                      ? `${row.description.substring(0, 100)}...`
                      : row.description}
                  </TableCell>
                  <TableCell>{row.creator}</TableCell>
                  <TableCell>{row.createdAt}</TableCell>
                  <TableCell>{row.theme}</TableCell>
                  <TableCell>
                    {row.cores.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {row.cores.map((core, idx) => (
                          <Chip key={idx} label={core} size="small" />
                        ))}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {row.objectives.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {row.objectives.slice(0, 3).map((objective, idx) => (
                          <Chip key={idx} label={objective} size="small" variant="outlined" />
                        ))}
                        {row.objectives.length > 3 && (
                          <Chip label={`+${row.objectives.length - 3} más`} size="small" variant="outlined" />
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

