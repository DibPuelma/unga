import { Grid, Typography } from "@mui/material";
import { getStudent } from "db/student";
import Head from "next/head";
import { isAuthorized } from "services/Authorization";
import HistoricReportCard from "src/components/report/HistoricReportCard";
import { getDownloadedReportsByStudent } from "db/downloadedStudentsReport";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user } = session;
  const { params: { studentId } } = context;
  const allReports = await getDownloadedReportsByStudent(studentId);
  const student = await getStudent(studentId);

  return {
    props: {
      student,
      allReports,
      user,
    },
  };
}

export default function StudentReports({ student, allReports, user }) {
  return (
    <>
      <Head>
        <title>Informes de {student.firstName} {student.lastName}</title>
      </Head>
      {allReports.length === 0 ? (
        <Typography textAlign="center">No se han descargado informes de {student.firstName}</Typography>
      ) : (
        <Grid container columns={{ xs: 1, sm: 2, md: 3, }} spacing={2}>
          {allReports.map((report) => (
            <Grid key={report.id} item xs={1}>
              <HistoricReportCard report={report} user={user} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}