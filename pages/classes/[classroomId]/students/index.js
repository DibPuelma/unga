import { Box, Typography } from "@mui/material";
import { getStudentsForClassroom } from "db/student";
import Head from "next/head";
import { useContext, useEffect, useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import PlansService from "services/PlansService";
import MassAddStudents from "src/components/students/MassAddStudents";
import StudentsList from "src/components/students/StudentsList";
import { UserContext } from "src/context/UserContext";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.INSTITUTIONAL_ONLY);
  if (!isAuthorizedValue) return returnValue;

  
  const { params: { classroomId } } = context;
  const students = await getStudentsForClassroom(classroomId);
  return {
    props: serializeForNextProps({
      classroomId,
      students
    }),
  };
}

export default function Students({ classroomId, students: propsStudents }) {
  const { institution } = useContext(UserContext);
  const classroom = useMemo(() => institution.classrooms.find(
    (classroom) => classroom.id === classroomId
    ), [classroomId]);
  const [students, setStudents] = useState(propsStudents);

  const handleCreateStudents = (newStudents) => {
    setStudents((oldStudents) => [
      ...oldStudents,
      ...newStudents,
    ])
  }

  return (
    <>
      <Head>
        <title>Párvulos {classroom.name}</title>
      </Head>
      <Box my={2}>
        {students.length === 0 && <Typography mb={2} textAlign="center">No hay estudiantes en esta sala</Typography>}
        <StudentsList students={students} />
      </Box>
      <MassAddStudents onSave={handleCreateStudents} classroom={classroom} />
    </>
  )
}