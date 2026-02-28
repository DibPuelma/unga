import { Accordion, AccordionDetails, AccordionSummary, Button, Checkbox, Dialog, DialogActions, FormControl, FormControlLabel, FormGroup, FormLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import moment from "moment-timezone";
import { useContext, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import ReportService from "services/Report";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import axios from "axios";
import { useRouter } from "next/router";
import { LoadingButton } from "@mui/lab";
import { ExpandMoreOutlined } from "@mui/icons-material";

export default function GenerateReportButton({ fullWidth, classroomId, studentId }) {
  const router = useRouter();
  const { trackGenerateReport } = useContext(MixpanelContext);
  const [timePeriods, setTimePeriods] = useState({});
  const [hideDate, setHideDate] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [allowEvaluations, setAllowEvaluations] = useState(false);
  const [showAttendance, setShowAttendance] = useState('');
  const [team, setTeam] = useState('');
  const [formError, setFormError] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classroomReportConfiguration, setClassroomReportConfiguration] = useState({});

  const handleSelectedPeriodChange = (timePeriod) => {
    setTimePeriods((oldValue) => ({ ...oldValue, [timePeriod]: { ...oldValue[timePeriod], show: !oldValue[timePeriod].show } }));
  }

  const handlePeriodDateChange = (date, timePeriod) => {
    setTimePeriods((oldValue) => ({ ...oldValue, [timePeriod]: { ...oldValue[timePeriod], date } }));
  }

  const handleSetOpen = async () => {
    setOpen(true);
    const response = await axios.get(`/api/classrooms/${classroomId}/report-configuration`);
    setClassroomReportConfiguration(response.data);
    setTimePeriods(Object.entries(response.data.timePeriods).reduce(
      (acc, [timePeriod, data]) => ({
        ...acc,
        [timePeriod]: {
          ...data, date: moment(data.date)
        },
      }),
      {}
    ));
    setHideDate(response.data.hideDate);
    setShowTeam(response.data.showTeam);
    setShowAttendance(response.data.showAttendance);
    setTeam(response.data.team);
    setLoading(false);
  }

  const handleGenerateReport = async () => {
    const formCompleted = Object.values(timePeriods).some((data) => data.show && data.date);
    if (!formCompleted) {
      setFormError(true);
      return;
    }
    setReportLoading(true);
    await axios.patch(`/api/classrooms/${classroomId}/report-configuration/${classroomReportConfiguration.id}`, {
      timePeriods: {
        ...Object.entries(timePeriods).reduce(
          (acc, [timePeriod, data]) => ({
            ...acc,
            [timePeriod]: {
              ...data,
              date: data.date.format('YYYY-MM-DD')
            },
          }),
          {}
        ),
      },
      hideDate,
      showAttendance,
      showTeam,
      team,
      allowEvaluations,
    });
    // trackGenerateReport();
    router.push(`/classes/${classroomId}/students/${studentId}/report`);
  }

  return (
    <>
      <Button
        fullWidth={fullWidth}
        variant="contained"
        onClick={handleSetOpen}
      >
        Generar informe
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        {loading ? <UngaCircularProgress width="100%" /> : (
          <>
            <Stack p={2}>
              <Typography variant="h6">¿Qué periodos quieres mostrar?</Typography>
              <Typography color="text.secondary"><b>No se mostrarán las evaluaciones realizadas posteriormente a la fecha de corte</b></Typography>
              <FormControl sx={{ mt: 2 }} component="fieldset" variant="standard">
                <FormGroup>
                  {Object.entries(timePeriods).map(([timePeriod, data]) => (
                    <Stack key={timePeriod} direction="row" alignItems="center" mb={2} justifyContent="space-between">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={data.show ?? false}
                            onChange={() => handleSelectedPeriodChange(timePeriod)}
                            name={timePeriod}
                          />
                        }
                        label={data.name}
                      />
                      <>
                        {data.show && (
                          <Stack>
                            <DesktopDatePicker
                              label={`Fecha de corte para ${data.name}`}
                              inputFormat="DD/MM/yyyy"
                              value={data.date}
                              onChange={(date) => handlePeriodDateChange(date, timePeriod)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  error={false}
                                  size="small"
                                  sx={{ width: { xs: '100%', sm: 250 } }}
                                />
                              )}
                            />
                          </Stack>
                        )}
                      </>
                    </Stack>
                  ))}
                </FormGroup>
              </FormControl>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreOutlined />}
                  aria-controls="advanced-options-content"
                  id="advanced-options-header"
                >
                  <Typography>Opciones avanzadas</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack rowGap={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Ocultar fecha</Typography>
                      <Switch
                        size="small"
                        checked={hideDate}
                        onChange={() => setHideDate((oldValue) => !oldValue)}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Mostrar asistencia</Typography>
                      <Switch
                        size="small"
                        checked={showAttendance}
                        onChange={() => setShowAttendance((oldValue) => !oldValue)}
                      />
                    </Stack>
                    <Stack rowGap={1}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Mostrar equipo pedagógico</Typography>
                        <Switch
                          size="small"
                          checked={showTeam}
                          onChange={() => setShowTeam((oldValue) => !oldValue)}
                        />
                      </Stack>
                      {showTeam && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Escribe lo que quieres que aparezca en el informe"
                          value={team}
                          onChange={(event) => setTeam(event.target.value)}
                        />
                      )}
                    </Stack>
                    <Stack rowGap={1}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Permitir evaluar</Typography>
                        <Switch
                          size="small"
                          checked={allowEvaluations}
                          onChange={() => setAllowEvaluations((oldValue) => !oldValue)}
                        />
                      </Stack>
                      {allowEvaluations && (
                        <Typography variant="body2" color="error">
                          IMPORTANTE: si activas esta opción, podrás evaluar cada periodo. Estas evaluaciones quedarán registradas como si hubieran sido realizadas en la fecha de corte que pusiste.
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
            {formError && (
              <Typography color="error" textAlign="center" variant="body2">
                Debes seleccionar al menos 1 periodo y su fecha
              </Typography>
            )}
            <DialogActions>
              <Button color="error" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <LoadingButton
                onClick={handleGenerateReport}
                variant="outlined"
                loading={reportLoading}
              >
                Generar informe
              </LoadingButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}