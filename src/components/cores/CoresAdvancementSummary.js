import { useRef } from "react"
import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material"
import TutorialLink from "../tutorials/TutorialLink"
import CoresList from "./CoresList"
import { DownloadOutlined } from "@mui/icons-material"
import { useReactToPrint } from "react-to-print"
import moment from "moment-timezone"


export default function CoresAdvancementSummary({ cores, classroom }) {
  const summaryRef = useRef();
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'))
  const print = useReactToPrint({
    content: () => summaryRef.current,
    documentTitle: `Resumen avance ${classroom.name}.pdf`,
  });

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: letter landscape; margin: 0.5cm;}
          #summary-header {
            display: block;
          }
        `}
      </style>
      <Stack direction="row" mb={2} alignItems="center" justifyContent="space-between">
        <TutorialLink id="cb1df65c95b44cbd862a48f7d5304ca9" />
        <Button
          startIcon={<DownloadOutlined />}
          variant="contained"
          onClick={print}
        >
          Descargar
        </Button>
      </Stack>
      <Box ref={summaryRef}>
        <Typography variant="h6" mb={2} id="summary-header" display="none">
          Resumen avance {classroom.name} al {moment().format('DD [de] MMMM [de] YYYY')}
        </Typography>
        <CoresList smUp={smUp} cores={cores} />
      </Box>
    </>
  )
}