import UngaCircularProgress from "../utils/UngaCircularProgress"
import { Button, Dialog, DialogActions, DialogContent, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material"
import moment from "moment-timezone"
import { useState } from "react"
import axios from "axios"

export default function StudentEvaluationsHistory({ student, core }) {
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [objectivesEvaluations, setObjectivesEvaluations] = useState(null);
  const [subObjectivesEvaluations, setSubObjectivesEvaluations] = useState(null);

  const handleOpenDialog = async () => {
    setShowHistory(true);
    try {
      const promises = [
        axios.get(
          `/api/classrooms/${student.class.id}/students/${student.id}/evaluations/objectives?coreId=${core.id}`
        ),
        axios.get(
          `/api/classrooms/${student.class.id}/students/${student.id}/evaluations/sub-objectives?coreId=${core.id}`
        ),
      ]
      const [objectivesResponse, subObjectivesResponse] = await Promise.all(promises);
      setObjectivesEvaluations(objectivesResponse.data);
      setSubObjectivesEvaluations(subObjectivesResponse.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpenDialog}
      >
        Ver historial de evaluaciones
      </Button>
      <Dialog maxWidth="xl" open={showHistory} onClose={() => setShowHistory(false)}>
        <DialogContent>
          {loading ? (
            <UngaCircularProgress width={{ xs: '70vw', sm: '80vw', md: '60vw', lg: '50vw' }} />
          ) : (
            <>
              <Typography variant="h6" mb={1}>Indicadores de informe</Typography>
              {objectivesEvaluations.length === 0 ? (
                <Typography>No se han realizado evaluaciones de indicadores de informe en {core.name} para {student.firstName}</Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Indicador', 'Fecha', 'Nivel de logro'].map((label) => (
                        <TableCell key={label}>
                          <Typography fontWeight={500}>{label}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {objectivesEvaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>
                          <Typography>{evaluation.objective.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{moment(evaluation.createdAt).format('DD [de] MMMM [de] YYYY')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{evaluation.levelOfAchievement.name}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Typography variant="h6" mb={1} mt={4}>Indicadores de evaluación</Typography>
              {subObjectivesEvaluations.length === 0 ? (
                <Typography>No se han realizado evaluaciones de indicadores de evaluación en {core.name} para {student.firstName}</Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Indicador', 'Fecha', 'Nivel de logro'].map((label) => (
                        <TableCell key={label}>
                          <Typography fontWeight={500}>{label}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subObjectivesEvaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>
                          <Typography>{evaluation.subObjective.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{moment(evaluation.createdAt).format('DD [de] MMMM [de] YYYY')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{evaluation.levelOfAchievement.name}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )
          }
        </DialogContent >
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog >
    </>
  )
}