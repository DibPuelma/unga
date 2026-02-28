import { Grid, Stack, Typography } from "@mui/material"
import UngaRatioImage from "../utils/UngaRatioImage"
import ActivityCalendarPrintable from "../activity/ActivityCalendarPrintable"

export default function PrintCalendarFull({
  institution,
  classroomName,
  levelName,
  studentCount,
  lessonPlanTitle,
  mainTeacher,
  otherTeachersNames,
  daysToPrint,
  plannedActivitiesPerDay,
  fontSizes,
  fontSizeMultiplier,
}) {
  return (
    <>
      <Stack alignItems="center">
        {institution.logo && (
          <UngaRatioImage priority image={institution.logo} baseHeight={fontSizes[20] * 3} alt="logo" />
        )}
        <Typography textAlign="center" fontSize={fontSizes[20]}>
          {institution.name}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Stack>
          <Typography textAlign="left" variant="body2" fontSize={fontSizes[14]}>
            Planificación {classroomName}
          </Typography>
          <Typography textAlign="left" fontSize={fontSizes[12]}>
            {classroomName !== levelName && `${levelName}, `} {studentCount > 0 && `${studentCount} niños y niñas`}
          </Typography>
        </Stack>
        <Stack>
          <Typography variant="body2" fontSize={fontSizes[14]}>
            {lessonPlanTitle}
          </Typography>
          {mainTeacher && (
            <Typography fontSize={fontSizes[12]}>
              Educadora a cargo: {mainTeacher.firstName} {mainTeacher.lastName}
            </Typography>
          )}
          {otherTeachersNames && (
            <Typography fontSize={fontSizes[12]}>Equipo: {otherTeachersNames}</Typography>
          )}
        </Stack>
      </Stack>
      <Grid container columns={daysToPrint.length} border={0.5}>
        {daysToPrint.map((workDay, i) => {
          return (
            <Grid key={workDay} item xs={1} borderBottom={0.5} pl={0.5} borderLeft={i > 0 ? 0.5 : 0}>
              <Typography fontSize={12 * fontSizeMultiplier}>
                {workDay.charAt(0).toLocaleUpperCase()}{workDay.substring(1, workDay.length)}
              </Typography>
            </Grid>
          )
        })}
        {Object.values(plannedActivitiesPerDay).map((plannedActivities, i) => {
          const plannedActivitiesToShow = plannedActivities.filter((plannedActivity) => !plannedActivity.hide)
          return (
            <Grid key={i} item xs={1} borderLeft={i > 0 ? 0.5 : 0} px={0.5} overflow="scroll">
              {plannedActivitiesToShow.length === 0 ? (
                <Typography m={2} fontSize={16 * fontSizeMultiplier}>Sin actividades planificadas</Typography>
              ) : plannedActivitiesToShow.map((plannedActivity, i) => (
                <ActivityCalendarPrintable
                  key={plannedActivity.id}
                  position={i + 1}
                  fontSizeMultiplier={fontSizeMultiplier}
                  activity={plannedActivity.activity}
                  fontSizes={fontSizes}
                />
              ))}
            </Grid>
          )
        })}
      </Grid>
    </>
  )
}