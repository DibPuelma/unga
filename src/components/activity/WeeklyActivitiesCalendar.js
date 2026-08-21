import { Button, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material";
import moment from "moment-timezone";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import PlannedActivityCard from "./PlannedActivityCard";
import Link from "src/Link";
import { IS_WEEKEND } from "src/helpers/dates";
import { Add, PrintOutlined } from "@mui/icons-material";
import CalendarActivityCard from "./CalendarActivityCard";
import { useContext, useMemo, useState } from "react";
import { capitalize } from "lodash";
import { UserContext } from "src/context/UserContext";
import axios from "axios";
import useNoPlanWarning from "src/hooks/useNoPlanWarning";
import { useRouter } from "next/router";
import { LoadingButton } from "@mui/lab";
import { CalendarEventsList } from "./CalendarEventBadge";
import { isB2CPlan } from "src/helpers/plans";


export default function WeeklyActivitiesCalendar({
  activitiesByDay,
  planned,
  startOfWeek,
  classroomId,
  withAdd,
  addBaseUrl,
  withPrint,
  copying,
  handleSelectPlannedActivity,
  checkIfPlannedActivityIsSelected,
  printableFullUrl,
  printableTableUrl,
  onDragEnd,
  onRemove,
  toggleLockActivity,
  emptyDayMesage = 'No hay experiencias agregadas aún',
  calendarEvents = [],
}) {
  const theme = useTheme();
  const router = useRouter();
  const { userHasPlan, user } = useContext(UserContext);
  const handleOpenNoPlanWarning = useNoPlanWarning({
    title: '¡Ya calendarizaste 5 experiencias!',
    description: 'Para poder calendarizar más, debes comenzar tu prueba gratuita registrando un medio de pago',
  })
  const [printMenuAnchorEl, setPrintMenuAnchorEl] = useState({});
  const [loading, setLoading] = useState({});
  const containerHeight = useMemo(() => {
    let baseValue = 70;
    if (withAdd) baseValue -= 5;
    if (withPrint) baseValue -= 5;
    return `${baseValue}vh`;
  })

  const handleOpenPrintMenu = (event, workDay) => {
    setPrintMenuAnchorEl({ [workDay]: event.currentTarget });
  };

  const handleClosePrintMenu = () => {
    setPrintMenuAnchorEl({});
  };

  const handleAddActivity = async (indexQueryParams, workDay) => {
    // B2C plans (free/unga) are limited by AI-generation credits, not by how many
    // planned activities sit on the calendar, so the legacy trial gate below only
    // applies to institutional teachers without a plan.
    if (!userHasPlan && !isB2CPlan(user?.plan)) {
      setLoading({ [workDay]: true });
      const activitiesPlannedCountResponse = await axios.get(`/api/users/${user.id}/planned-activities/count`);
      setLoading({});
      if (activitiesPlannedCountResponse.data >= 5) {
        handleOpenNoPlanWarning();
        return;
      }
    }

    router.push(`${addBaseUrl}${indexQueryParams}`);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={{ xs: 8, sm: 2 }}
        minHeight={{ sm: containerHeight }}
        pb={10}
        id="calendar-container"
      >
        {Object.entries(activitiesByDay).map(([workDay, activities], i) => {
          const componentDate = moment(startOfWeek).add(parseInt(workDay) - 1, 'days');
          const isCurrentDay = moment().format('YYYYMMDD') === componentDate.format('YYYYMMDD');
          const isTourDate = isCurrentDay || (IS_WEEKEND && componentDate.day() === 1);
          const isInThePastOrNow = moment().endOf('day').isSameOrAfter(componentDate);
          const indexQueryParams = `?classroomId=${classroomId}&date=${componentDate.format('YYYY-MM-DD')}`;
          const printQueryParams = `?startDate=${componentDate.format('YYYY-MM-DD')}&endDate=${componentDate.format('YYYY-MM-DD')}`;
          return (
            <Stack
              key={workDay}
              direction="column"
              width={{ sm: "20%" }}
              justifyContent="space-between"
              id={isTourDate ? 'tour-date-container' : null}
            >
              <Typography
                variant="h6"
                textAlign={{ sm: 'center' }}
                color={isCurrentDay ? theme.palette.primary.main : 'inherit'}
                gutterBottom
                height={{ sm: "8%" }}
              >
                {capitalize(componentDate.format('dddd DD'))}
              </Typography>
              <Droppable droppableId={workDay}>
                {(provided) => (
                  <Stack
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    border={{ xs: 0, sm: 1 }}
                    borderRadius={3}
                    minHeight={{ sm: "92%" }}
                    borderColor={(theme) => theme.palette.grey[500]}
                    p={1}
                    mb={withAdd || withPrint ? 2 : 0}
                    spacing={2}
                  >
                    <CalendarEventsList events={calendarEvents} currentDay={componentDate.toDate()} />
                    {activities.length > 0 ?
                      activities.map((activity, index) => (
                        <Draggable
                          key={activity.id}
                          draggableId={activity.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              {planned ? (
                                <PlannedActivityCard
                                  onSelect={copying ? handleSelectPlannedActivity : null}
                                  selected={() => checkIfPlannedActivityIsSelected(activity.id)}
                                  isInThePastOrNow={isInThePastOrNow}
                                  plannedActivity={activity}
                                  position={index}
                                />
                              ) : (
                                <CalendarActivityCard
                                  activity={activity}
                                  toggleLock={() => toggleLockActivity(workDay, activity.id)}
                                  onRemove={() => onRemove(workDay, activity.id)}
                                />

                              )}
                            </div>
                          )}
                        </Draggable>
                      )) : (
                        <Typography variant="body2" m={1}>
                          {emptyDayMesage}
                        </Typography>
                      )}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
              {withAdd && (
                <LoadingButton
                  fullWidth
                  color="primary"
                  variant="contained"
                  startIcon={<Add />}
                  id={isTourDate ? 'tour-date-add-button' : null}
                  onClick={() => handleAddActivity(indexQueryParams, workDay)}
                  loading={loading[workDay]}
                >
                  Agregar experiencia
                </LoadingButton>
              )}
              {withPrint && (
                <>
                  <Button
                    sx={{ mt: 2 }}
                    fullWidth
                    color="primary"
                    variant="outlined"
                    startIcon={<PrintOutlined />}
                    onClick={(e) => handleOpenPrintMenu(e, workDay)}
                  >
                    Imprimir día
                  </Button>
                  <Menu
                    id={`print-${workDay}-menu`}
                    anchorEl={printMenuAnchorEl[workDay]}
                    open={Boolean(printMenuAnchorEl[workDay])}
                    onClose={handleClosePrintMenu}
                    MenuListProps={{
                      'aria-labelledby': 'print-button',
                    }}
                  >
                    <Link noLinkStyle href={`${printableFullUrl}${printQueryParams}`}>
                      <MenuItem>Calendario</MenuItem>
                    </Link>
                    <Link noLinkStyle href={`${printableTableUrl}${printQueryParams}`}>
                      <MenuItem>Tabla</MenuItem>
                    </Link>
                  </Menu>
                </>
              )}
            </Stack>
          )
        })}
      </Stack>
    </DragDropContext>
  )
}