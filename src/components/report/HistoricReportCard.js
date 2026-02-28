import { ArrowForwardIos, LockOutlined } from "@mui/icons-material";
import { Paper, Stack, Typography } from "@mui/material";
import moment from "moment-timezone";
import { useMemo } from "react";
import Link from "src/Link";
import { arrayToListText } from "src/helpers/arrays";

export default function HistoricReportCard({ report, user }) {
  const {
    institution: { name: institutionName },
    classroom: { name: classroomName },
    level: { name: levelName },
    downloader: { firstName: downloaderFirstName, lastName: downloaderLastName },
    mainTeacherAtDownload,
    asset,
    downloadedAt,
    timePeriods,
  } = report;

  const periodsDownloaded = useMemo(() => arrayToListText(
    timePeriods.map(({ name, date }) => `${name} ${moment(date).format('DD [de] MMMM')}`)
  ), [timePeriods])

  const mainTeacherText = useMemo(() => {
    if (!mainTeacherAtDownload) return ''
    const { firstName, lastName } = mainTeacherAtDownload
    return `Educadora a cargo ${firstName} ${lastName}`
  }, [mainTeacherAtDownload])

  return (
    <Link
      href={asset.secure_url}
      noLinkStyle
      target="_blank"
    >
      <Paper sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h6">{moment(downloadedAt).format('DD [de] MMMM [de] YYYY HH:mm')}</Typography>
            <Typography variant="caption" color="GrayText" mb={2}>{periodsDownloaded}</Typography>
            <Typography>{levelName}</Typography>
            <Typography variant="body2">{institutionName}</Typography>
            <Typography variant="body2">Sala {classroomName}</Typography>
            {mainTeacherText && (
              <Typography variant="caption" color="GrayText" mb={2}>{mainTeacherText}</Typography>
            )}
            <Typography variant="caption" color="GrayText">Descargado por {downloaderFirstName} {downloaderLastName}</Typography>
          </Stack>
          <ArrowForwardIos color="primary" />
        </Stack>
      </Paper>
    </Link>
  )
}