import { Add, Check, Close, SaveOutlined } from "@mui/icons-material";
import { Button, CircularProgress, IconButton, MenuItem, Stack, Typography } from "@mui/material"
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react"
import UngaSelect from "src/components/utils/UngaSelect"
import _ from 'lodash';
import { UserContext } from "src/context/UserContext";
import { MixpanelContext } from "services/MixpanelContext";

export default function ConfigureClassroomTeachers({
  activeInstitutionTeachers,
  classroomTeachers,
  classroom,
}) {
  const { user } = useContext(UserContext);
  const { trackRemoveTeacherFromClassroom } = useContext(MixpanelContext);
  const classroomId = useMemo(() => classroom.id, [classroom])
  const [dynamicMainTeacher, setDynamicMainTeacher] = useState(classroom.mainTeacher?.id || 'noSelection')
  const [dynamicClassroomTeachers, setDynamicClassroomTeachers] = useState(classroomTeachers);
  const [updateMainTeacherRequest, setUpdateMainTeacherRequest] = useState({
    loading: false,
    error: false,
    success: false,
  });
  const [addNewTeacherRequest, setAddNewTeacherRequest] = useState({});
  const [removeOldTeacherRequest, setRemoveOldTeacherRequest] = useState({});
  const [newTeachers, setNewTeachers] = useState({});
  const nonClassroomTeachers = useMemo(() => {
    const classroomTeachersIds = dynamicClassroomTeachers.map((teacher) => teacher.id);
    const nonClassroomTeachers = activeInstitutionTeachers.filter((teacher) => !classroomTeachersIds.includes(teacher.id))
    return nonClassroomTeachers
  }, [dynamicClassroomTeachers, activeInstitutionTeachers])

  const availableTeachers = useMemo(() => (
    nonClassroomTeachers.filter((teacher) =>
      !Object.values(newTeachers).map((teacher) => teacher.id).includes(teacher.id)
    )
  ), [newTeachers, nonClassroomTeachers])

  useEffect(() => {
    setDynamicMainTeacher(classroom.mainTeacher?.id || 'noSelection')
    setDynamicClassroomTeachers(classroomTeachers);
  }, [classroom, classroomTeachers])

  const handleAddTeacher = () => {
    const temporalId = Math.random().toString();
    setNewTeachers((oldValue) => {
      return {
        ...oldValue,
        [temporalId]: availableTeachers[0],
      }
    });
  }

  const handleMainTeacherChange = async ({ target: { value } }) => {
    setDynamicMainTeacher(value);
    setUpdateMainTeacherRequest({ loading: true, error: false });
    try {
      if (value === 'noSelection') {
        await axios.patch(`/api/classrooms/${classroomId}`, { mainTeacher: null });
      }
      else {
        await axios.patch(`/api/classrooms/${classroomId}`, { mainTeacher: value });
        const response = await handleAddClassroomToTeacher(value);
        const newMainTeacher = response.data;
        setDynamicClassroomTeachers((oldValue) => _.uniqBy([...oldValue, newMainTeacher], (teacher) => teacher.id));
      }
      setUpdateMainTeacherRequest({ success: true });
    } catch {
      setUpdateMainTeacherRequest({ error: true });
    } finally {
      setUpdateMainTeacherRequest((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const handleNewTeacherChange = async ({ target: { value, name: temporalId } }) => {
    const teacher = activeInstitutionTeachers.find((teacher) => teacher.id === value);
    setNewTeachers((oldValue) => ({ ...oldValue, [temporalId]: teacher }));
  }

  const handleRemoveOldTeacher = async (teacherId) => {
    setRemoveOldTeacherRequest((oldValue) => ({ ...oldValue, [teacherId]: { loading: true, error: '' } }));
    if (teacherId === user.id) {
      setRemoveOldTeacherRequest((oldValue) => ({
        ...oldValue,
        [teacherId]: {
          loading: false,
          error: 'No te puedes eliminar de esta sala, porque perderías el acceso',
        }
      }));
      return;
    }
    try {
      const selectedTeacher = activeInstitutionTeachers.find((teacher) => teacher.id === teacherId);
      const newClassrooms = [...selectedTeacher.classrooms].filter(
        (classroom) => classroom !== classroomId
      );
      await axios.patch(`/api/users/${teacherId}`, { classrooms: newClassrooms })
      // trackRemoveTeacherFromClassroom({
      //   classroomId,
      //   teacherId,
      //   teacherName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
      // });
      setDynamicClassroomTeachers(
        (oldValue) => [...oldValue].filter((teacher) => teacher.id !== teacherId)
      );
      if (dynamicMainTeacher === teacherId) {
        setDynamicMainTeacher('noSelection');
        await axios.patch(`/api/classrooms/${classroomId}`, { mainTeacher: null });
      }
    } catch {
      setRemoveOldTeacherRequest((oldValue) => ({ ...oldValue, [teacherId]: { error: 'Error al eliminar el usuario de la sala' } }));
    } finally {
      setRemoveOldTeacherRequest((oldValue) => ({
        ...oldValue,
        [teacherId]: {
          ...oldValue[teacherId],
          loading: false
        }
      }));
    }
  }

  const handleRemoveNewTeacher = (temporalId) => {
    const newNewTeachers = { ...newTeachers };
    delete newNewTeachers[temporalId];
    setNewTeachers(newNewTeachers);
  }

  const handleAddClassroomToTeacher = async (teacherId) => {
    const selectedTeacher = activeInstitutionTeachers.find((teacher) => teacher.id === teacherId);
    const newClassrooms = selectedTeacher.classrooms ? _.uniq([...selectedTeacher.classrooms, classroomId]) : [classroomId];
    return await axios.patch(`/api/users/${teacherId}`, { classrooms: newClassrooms })
  }

  const handleSaveNewTeacher = async (temporalId) => {
    setAddNewTeacherRequest((oldValue) => ({ ...oldValue, [temporalId]: { loading: true, error: false } }));
    try {
      await handleAddClassroomToTeacher(newTeachers[temporalId].id);
      setAddNewTeacherRequest((oldValue) => ({ ...oldValue, [temporalId]: { success: true } }));
      setDynamicClassroomTeachers((oldValue) => [...oldValue, newTeachers[temporalId]]);
      handleRemoveNewTeacher(temporalId);
    } catch {
      setAddNewTeacherRequest((oldValue) => ({ ...oldValue, [temporalId]: { error: true } }));
    } finally {
      setAddNewTeacherRequest((oldValue) => ({
        ...oldValue,
        [temporalId]: {
          ...oldValue[temporalId],
          loading: false
        }
      }));
    }
  }

  return (
    <>
      <Stack mb={4} alignItems="flex-start">
        <Typography variant="h6" gutterBottom>Educadora a cargo</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <UngaSelect
            sx={{ width: 350 }}
            name="mainTeacher"
            value={dynamicMainTeacher}
            onChange={handleMainTeacherChange}
            options={activeInstitutionTeachers}
            noSelectionValue={<MenuItem value="noSelection">Sin educadora a cargo</MenuItem>}
            mapFunction={({ firstName, lastName, id }) => (
              <MenuItem key={id} value={id}>
                {firstName} {lastName}
              </MenuItem>
            )}
            renderValue={null}
            disabled={updateMainTeacherRequest.loading}
          />
          {updateMainTeacherRequest.loading && (<CircularProgress size={24} />)}
          {updateMainTeacherRequest.error && (<Typography color="error">Error al actualizar</Typography>)}
          {updateMainTeacherRequest.success && (<Check color="success" />)}
        </Stack>
      </Stack>
      <Typography variant="h6" gutterBottom>Usuarios con acceso a la sala</Typography>
      <Stack alignItems="flex-start" spacing={1}>
        {dynamicClassroomTeachers.map((teacher) => {
          const id = teacher.id
          return (
            <Stack key={id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography key={id}>
                  {teacher.firstName} {teacher.lastName}
                </Typography>
                {!removeOldTeacherRequest[id]?.loading && !user.role.includes('individual') && (
                  <IconButton size="small" onClick={() => handleRemoveOldTeacher(id)} title="Quitar">
                    <Close fontSize="small" color="error" />
                  </IconButton>
                )}
                {removeOldTeacherRequest[id]?.loading && (<CircularProgress size={24} />)}
              </Stack>
              {Boolean(removeOldTeacherRequest[id]?.error) && (<Typography variant="body2" color="error">{removeOldTeacherRequest[id].error}</Typography>)}
            </Stack>
          )
        })}
        {Object.entries(newTeachers).map(([temporalId, data]) => (
          <Stack direction="row" spacing={1} alignItems="center" key={temporalId}>
            <UngaSelect
              sx={{ width: 350 }}
              name={temporalId}
              value={data.id}
              onChange={handleNewTeacherChange}
              options={[...availableTeachers, data]}
              mapFunction={({ firstName, lastName, id }) => (
                <MenuItem key={id} value={id}>
                  {firstName} {lastName}
                </MenuItem>
              )}
              renderValue={null}
              disabled={addNewTeacherRequest[temporalId]?.loading}
            />
            {!addNewTeacherRequest[temporalId]?.loading && (
              <>
                <IconButton size="small" onClick={() => handleSaveNewTeacher(temporalId)}>
                  <SaveOutlined fontSize="small" color="primary" />
                </IconButton>
                <IconButton size="small" onClick={() => handleRemoveNewTeacher(temporalId)} title="Quitar">
                  <Close fontSize="small" color="error" />
                </IconButton>
              </>
            )}
            {addNewTeacherRequest[temporalId]?.loading && (<CircularProgress size={24} />)}
            {addNewTeacherRequest[temporalId]?.error && (<Typography color="error">Error al asignar la educadora</Typography>)}
          </Stack>
        ))}
        {availableTeachers.length > 0 && (
          <Button
            startIcon={<Add />}
            onClick={handleAddTeacher}
          >
            Agregar educadora o técnico
          </Button>
        )}
      </Stack>
    </>
  )
}