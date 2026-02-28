import { Box, Breadcrumbs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { getLevelsOfAchievement } from "db/levelsOfAchievement";
import { isAuthorized } from "services/Authorization";
import { serializeForNextProps } from "src/helpers/businessLogic";
import { getInstitution } from "db/institution";
import Head from "next/head";
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

  const levelsOfAchievement = await getLevelsOfAchievement(institutionId);
  
  // Sort by value ascending (already sorted by the function, but ensure it)
  const sortedLevels = [...levelsOfAchievement].sort((a, b) => a.value - b.value);

  return {
    props: serializeForNextProps({
      levelsOfAchievement: sortedLevels,
      institution,
      institutionId,
    }),
  };
}

export default function InstitutionLevelsOfAchievement({ levelsOfAchievement, institution, institutionId }) {
  return (
    <>
      <Head>
        <title>Niveles de Logro - {institution.name || 'Institución'}</title>
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
          <Typography color="text.primary">Niveles de Logro</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Niveles de Logro - {institution.name || 'Institución'}
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 400 }} aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Descripción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {levelsOfAchievement.map((level) => (
                <TableRow key={level.id} hover>
                  <TableCell>{level.name}</TableCell>
                  <TableCell align="right">{level.value}</TableCell>
                  <TableCell>{level.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

