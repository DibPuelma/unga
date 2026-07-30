import { Box, Typography } from '@mui/material';

import ReportObjectivesList from '../report/ReportObjectivesList';
import ReportCoreHeader from '../report/ReportCoreHeader';

export default function CoreReportDetail({
  core,
  qualitativeOnly,
  timePeriods,
}) {

  return (
    <Box>
      {qualitativeOnly ? (
        <Typography variant="subtitle1" fontWeight="bold">
          {core.name}
        </Typography>
      ) : (
        <>
          <Box mb={2} sx={{ breakInside: 'avoid', breakAfter: 'avoid' }}>
            <ReportCoreHeader core={core} timePeriods={timePeriods}/>
          </Box>
          <Box mb={3}>
            <ReportObjectivesList
              coreId={core.id}
              objectives={core.objectives}
              timePeriods={timePeriods}
            />
          </Box>
        </>
      )}
    </Box>
  );
}