import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { LoadingButton } from '@mui/lab';
import DownloadIcon from '@mui/icons-material/Download';

export default function DownloadActivityPdfButton({ institutionId, activityId, activityName, ...buttonProps }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/institutions/${institutionId}/activities/${activityId}/pdf`,
        { responseType: 'blob' },
      );
      saveAs(response.data, `${activityName || 'experiencia'}.pdf`);
    } catch (e) {
      console.error('PDF download failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      variant="outlined"
      startIcon={<DownloadIcon />}
      loading={loading}
      onClick={handleDownload}
      {...buttonProps}
    >
      Descargar PDF
    </LoadingButton>
  );
}
