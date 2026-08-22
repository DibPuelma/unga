import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Menu, MenuItem, Stack, Tab, Tabs, TextField, Typography, useMediaQuery } from "@mui/material";
import { ExpandMore, InsertEmoticon, SchoolOutlined, SettingsOutlined } from "@mui/icons-material";
import { getAllClassesByInstitution, getClassroom } from "db/class";
import { getAllStudentsForClassroom } from "db/student";
import { isAuthorized } from "services/Authorization";
import StudentConfigureItem from "src/components/students/StudentConfigureItem";
import MassAddStudents from "src/components/students/MassAddStudents";
import { a11yTabProps } from 'src/helpers/a11y';
import { getOrCreateClassroomReportConfiguration } from "db/classroomReportConfiguration";
import axios from "axios";
import moment from "moment-timezone";
import { LoadingButton } from "@mui/lab";
import { getActiveInstitutionTeachersAndCoordinators, getClassroomTeachers } from "db/user";
import ConfigureClassroomTeachers from "src/components/classroom/configure/ConfigureClassroomTeachers";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user: { role } } = session;
  const { params: { classroomId, institutionId }, query: { tab } } = context;

  const classroom = await getClassroom(classroomId);
  const students = await getAllStudentsForClassroom(classroomId);
  const classroomReportConfiguration = await getOrCreateClassroomReportConfiguration(classroomId);
  const institutionClassrooms = await getAllClassesByInstitution(institutionId)
  const activeInstitutionTeachers = await getActiveInstitutionTeachersAndCoordinators(institutionId)
  const classroomTeachers = await getClassroomTeachers(classroomId);

  return {
    props: serializeForNextProps({
      classroom,
      students,
      classroomReportConfiguration,
      tab: parseInt(tab, 10),
      institutionClassrooms,
      institutionId,
      activeInstitutionTeachers,
      classroomTeachers,
      role,
    })
  }
}

export default function ConfigureClassroom({
  classroom,
  students,
  classroomReportConfiguration: propsClassroomReportConfiguration,
  tab: propsTab,
  institutionClassrooms,
  institutionId,
  activeInstitutionTeachers,
  classroomTeachers,
  role,
}) {
  const [componentStudents, setComponentStudents] = useState([]);
  const [tab, setTab] = useState(propsTab || 0);
  const [selectingStudents, setSelectingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectClassroomAnchorEl, setSelectClassroomAnchorEl] = useState(null);
  const [classroomChangeRequest, setClassroomChangeRequest] = useState({});
  const [dailyActivitiesPerDay, setDailyActivitiesPerDay] = useState(classroom.dailyActivitiesPerDay || '');
  const [savingDailyActivities, setSavingDailyActivities] = useState(false);
  const selectedStudentsObjects = useMemo(() => {
    return componentStudents.filter((student) => selectedStudents.includes(student.id))
  }, [componentStudents, selectedStudents]);

  const smUp = useMediaQuery(theme => theme.breakpoints.up('sm'))

  useEffect(() => setComponentStudents(students), [classroom]);

  const sortStudents = (a, b) =>
    a.firstName.toLocaleLowerCase() > b.firstName.toLocaleLowerCase() ? 1 : -1

  const activeStudentsByName = useMemo(() => (
    componentStudents
      .filter((student) => !student.deactivatedAt)
      .sort(sortStudents)
  ), [componentStudents]);

  const inactiveStudentsByName = useMemo(() => (
    componentStudents
      .filter((student) => student.deactivatedAt)
      .sort(sortStudents)
  ), [componentStudents]);

  const handleStudentUpdate = (student) => {
    setComponentStudents((oldValue) => {
      const newComponentStudents = [...oldValue];
      const changedStudentIndex = newComponentStudents.findIndex(
        (newStudent) => newStudent.id === student.id,
      );
      newComponentStudents[changedStudentIndex] = {
        ...student,
        fullName: `${student.firstName} ${student.lastName}`
      };
      return newComponentStudents;
    });
  }

  const handleCreateStudents = (newStudents) => {
    setComponentStudents((oldStudents) => [
      ...oldStudents,
      ...newStudents,
    ])
  }

  const handleTabChange = (_, newValue) => setTab(newValue);

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((oldValue) => {
      const index = oldValue.findIndex((student) => student === studentId)
      if (index !== -1) {
        return [
          ...oldValue.slice(0, index),
          ...oldValue.slice(index + 1)
        ]
      }
      return [...oldValue, studentId]
    })
  }

  const handleSelectAllStudents = ({ target: { checked } }) => {
    if (checked) setSelectedStudents(activeStudentsByName.map((student) => student.id));
    else setSelectedStudents([]);
  }

  const handleClassroomSelect = (classroom) => {
    setSelectedClassroom(classroom);
  }

  const handleClassroomChange = async () => {
    const body = selectedStudents.map((studentId) => ({
      id: studentId,
      classroom: selectedClassroom.id,
    }));
    setClassroomChangeRequest({ loading: true });
    try {
      await axios.patch(`/api/institutions/${institutionId}/students`, body)
      setComponentStudents(
        (oldValue) => oldValue.filter((student) => !selectedStudents.includes(student.id))
      );
      setSelectedStudents([]);
      setSelectedClassroom(null);
      setSelectingStudents(false);
    } catch (e) {
      setClassroomChangeRequest({ error: true });
      console.error(e);
    } finally {
      setClassroomChangeRequest((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const handleSaveDailyActivities = async () => {
    setSavingDailyActivities(true);
    try {
      const value = dailyActivitiesPerDay === '' ? null : parseInt(dailyActivitiesPerDay, 10);
      if (value !== null && (isNaN(value) || value < 0)) {
        throw new Error('El valor debe ser un número positivo');
      }
      await axios.patch(`/api/classrooms/${classroom.id}`, {
        dailyActivitiesPerDay: value,
      });
    } catch (e) {
      console.error(e);
      alert('No pudimos guardar la configuración');
    } finally {
      setSavingDailyActivities(false);
    }
  }

  const canConfigureDailyActivities = role === 'principal' || role === 'superAdmin';

  return (
    <Box pb={4}>
      <Head><title>Configurar {classroom.name}</title></Head>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="tabs de configuración"
        variant="scrollable"
      >
        {[
          <Tab
            key="Párvulos"
            label="Párvulos"
            {...a11yTabProps(0)}
            icon={<InsertEmoticon />}
            iconPosition={smUp ? 'start' : 'top'}
          />,
          <Tab
            key="Educadoras"
            label="Educadoras"
            {...a11yTabProps(1)}
            icon={<SchoolOutlined />}
            iconPosition={smUp ? 'start' : 'top'}
          />,
          ...(canConfigureDailyActivities ? [
            <Tab
              key="Configuración"
              label="Configuración"
              {...a11yTabProps(2)}
              icon={<SettingsOutlined />}
              iconPosition={smUp ? 'start' : 'top'}
            />
          ] : [])
        ]}
      </Tabs>
      <Box mt={2}>
        {tab === 0 && (
          <>
            <Box mb={10}>
              <Stack mb={2} direction="row" justifyContent="flex-end" spacing={2}>
                {selectingStudents && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setSelectingStudents(false)}
                    >
                      Cancelar
                    </Button>
                    {selectedStudents.length === 0 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        disabled
                      >
                        Selecciona uno o más párvulos
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          endIcon={<ExpandMore />}
                          onClick={(e) => setSelectClassroomAnchorEl(e.currentTarget)}
                        >
                          Selecciona la sala
                        </Button>
                        <Menu
                          anchorEl={selectClassroomAnchorEl}
                          open={Boolean(selectClassroomAnchorEl)}
                          onClose={() => setSelectClassroomAnchorEl(null)}
                          MenuListProps={{
                            'aria-labelledby': 'select-classroom-button',
                          }}
                        >
                          {institutionClassrooms
                            .filter(
                              (institutionClassroom) =>
                                institutionClassroom.id !== classroom.id
                            )
                            .map((classroom) => {
                              const { name, level: { name: levelName } } = classroom;
                              const showLevel = name !== levelName;
                              return (
                                <MenuItem
                                  key={classroom.id}
                                  onClick={() => handleClassroomSelect(classroom)}
                                >
                                  <Stack>
                                    <Typography>{name}</Typography>
                                    {showLevel && <Typography variant="caption" color="GrayText">{levelName}</Typography>}
                                  </Stack>
                                </MenuItem>
                              )
                            })}
                        </Menu>
                      </>
                    )}
                  </>
                )}
                {!selectingStudents && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setSelectingStudents(true)}
                  >
                    Cambiar de sala
                  </Button>
                )}
              </Stack>
              {activeStudentsByName.length > 0 ? (
                <>
                  <Box mb={4}>
                    {selectingStudents && (
                      <Stack pl={1} direction="row" alignItems="center">
                        <Checkbox onChange={handleSelectAllStudents} />
                        <Typography>Seleccionar todos</Typography>
                      </Stack>
                    )}
                    {activeStudentsByName.map((student, i) => (
                      <StudentConfigureItem
                        key={student.id}
                        i={i}
                        student={student}
                        onUpdate={handleStudentUpdate}
                        onSelect={selectingStudents && handleSelectStudent}
                        selected={selectedStudents.includes(student.id)}
                      />
                    ))}
                  </Box>
                  <MassAddStudents onSave={handleCreateStudents} classroom={classroom} />
                </>
              ) : (
                <Stack alignItems="flex-start">
                  <Typography gutterBottom>Esta sala no tiene párvulos</Typography>
                  <MassAddStudents onSave={handleCreateStudents} classroom={classroom} />
                </Stack>
              )}
            </Box>
            {
              inactiveStudentsByName.length > 0 && (
                <>
                  <Typography variant="h6">Párvulos desactivados</Typography>
                  {inactiveStudentsByName.map((student, i) => (
                    <StudentConfigureItem
                      key={student.id}
                      i={i}
                      student={student}
                      onUpdate={handleStudentUpdate}
                    />
                  ))}
                </>
              )
            }
          </>
        )}
        {tab === 1 && (
          <ConfigureClassroomTeachers
            activeInstitutionTeachers={activeInstitutionTeachers}
            classroomTeachers={classroomTeachers}
            classroom={classroom}
          />
        )}
        {tab === 2 && canConfigureDailyActivities && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configuración de actividades diarias
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              Configura cuántas actividades deben planificarse por día laboral para esta sala.
              Este valor se utiliza para calcular el avance esperado de actividades.
            </Typography>
            <Stack spacing={2} sx={{ maxWidth: 400 }}>
              <TextField
                label="Actividades por día"
                type="number"
                value={dailyActivitiesPerDay}
                onChange={(e) => setDailyActivitiesPerDay(e.target.value)}
                inputProps={{ min: 0, step: 1 }}
                helperText="Solo días laborales (excluye fines de semana y feriados)"
              />
              <Box>
                <LoadingButton
                  variant="contained"
                  onClick={handleSaveDailyActivities}
                  loading={savingDailyActivities}
                >
                  Guardar
                </LoadingButton>
              </Box>
            </Stack>
          </Box>
        )}
      </Box>
      <Dialog
        open={Boolean(selectedClassroom)}
        onClose={() => setSelectedClassroom(null)}
      >
        <DialogTitle>
          Confirma el cambio de sala
        </DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Cambiarás {selectedStudents.length} párvulos desde la sala <b>{classroom.name}</b> a la sala <b>{selectedClassroom?.name}</b>
          </Typography>
          <Stack mb={2}>
            {selectedStudentsObjects.map((student, i) => (
              <Typography key={student.id}>
                {i + 1}. {student.firstName} {student.lastName}
              </Typography>
            ))}
          </Stack>
          {classroomChangeRequest.error && (
            <Typography color="error" variant="body2">
              No pudimos cambiar a los niños de sala
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <LoadingButton
            onClick={handleClassroomChange}
            loading={classroomChangeRequest.loading}
          >
            Confirmar
          </LoadingButton>
          <Button
            onClick={() => setSelectedClassroom(null)}
            color="error"
            disabled={classroomChangeRequest.loading}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}