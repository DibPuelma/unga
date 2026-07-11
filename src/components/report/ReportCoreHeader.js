import { useContext } from "react";
import { Stack, Typography } from "@mui/material";
import { AdvancedReportContext } from "src/context/AdvancedReportContext";

export default function ReportCoreHeader({ core, timePeriods }) {
  const { name, advancement } = core;
  const { printing } = useContext(AdvancedReportContext);
  return (
    <Stack>
      <Typography variant={printing ? 'h6' : 'subtitle1'} fontWeight="bold">
        {name}
      </Typography>
      {timePeriods.map((timePeriod) => {
        const {
          advancementText,
          totalEvaluations,
          possibleEvaluations,
          advancement: periodAdvancement
        } = advancement[timePeriod.name];
        return (
          <Typography variant="body2" key={timePeriod.name}>
            <b>{timePeriod.name}. </b> 
            {periodAdvancement.toFixed(0)}% ({advancementText}) | {totalEvaluations} de {possibleEvaluations} evaluaciones
          </Typography>
        )
      })}
    </Stack>
  )
}