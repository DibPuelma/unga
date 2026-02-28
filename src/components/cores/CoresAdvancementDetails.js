import { useRef, useState } from "react";
import axios from "axios";
import useSWR from "swr"
import UngaCircularProgress from "../utils/UngaCircularProgress";
import { Button, Stack, Typography } from "@mui/material";
import ClassroomMonthlyAdvancementInCore from "../charts/ClassroomMonthlyAdvancementInCore";
import { DownloadOutlined } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import moment from "moment-timezone";

export default function CoresAdvancementDetails({ institutionId, classroom, startDate }) {
  const detailsRef = useRef();
  const { data, isLoading } = useSWR(
    `/api/institutions/${institutionId}/classrooms/${classroom.id}/cores/advancement-details?startDate=${startDate.format('YYYY-MM-DD')}`,
    axios,
    {
      revalidateOnFocus: false,
    }
  );

  const transformCanvasesToImages = () => {
    const canvases = document.getElementsByClassName('canvas');
    [...canvases].forEach((canvas) => {
      const dataUrl = canvas.toDataURL();
      const canvasImage = document.createElement('img');
      canvasImage.className = 'canvas-image';
      canvasImage.src = dataUrl;
      canvasImage.style.width = '1000px';
      canvasImage.style.height = canvas.style.height;
      canvas.style.display = 'none';
      canvas.parentNode.appendChild(canvasImage);
    });
  }


  const returnOriginalCanvases = () => {
    const canvasImages = document.getElementsByClassName('canvas-image');
    const canvases = document.getElementsByClassName('canvas');
    [...canvasImages].forEach((canvasImage) => {
      canvasImage.parentNode.removeChild(canvasImage);
    });
    [...canvases].forEach((canvas) => {
      canvas.style.display = 'block';
    })
  }

  const print = useReactToPrint({
    content: () => detailsRef.current,
    documentTitle: `Detalle avance ${classroom.name}.pdf`,
    onAfterPrint: returnOriginalCanvases,
  });



  const handlePrint = () => {
    transformCanvasesToImages();
    print();
  }

  if (isLoading || !data) {
    return (
      <UngaCircularProgress />
    )
  }

  return (
    <Stack rowGap={2} width="100%">
      <style type="text/css" media="print">
        {`
          @page { size: letter; margin: 0.5cm; }
          #details-header {
            display: block;
          }
        `}
      </style>
      <Stack alignItems="flex-end">
        <Button
          startIcon={<DownloadOutlined />}
          variant="contained"
          onClick={handlePrint}
        >
          Descargar
        </Button>
      </Stack>
      <Stack ref={detailsRef}>
        <Typography variant="h5" mb={2} id="details-header" display="none">
          Detalle avance {classroom.name} al {moment().format('DD [de] MMMM [de] YYYY')}
        </Typography>
        <Stack rowGap={8} ref={detailsRef}>
          {data.data.map((core) => (
            <Stack key={core.id} sx={{ breakInside: 'avoid' }}>
              <Typography variant="h6" gutterBottom>{core.name}</Typography>
              <ClassroomMonthlyAdvancementInCore coreWithMonthlyAdvancement={core} />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}