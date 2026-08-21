import React, { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { CircularProgress, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

export default function DownloadActivityPdfMenuItem({ institutionId, activityId, activityName }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
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
    <MenuItem onClick={handleDownload}>
      <ListItemIcon>
        {loading ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
      </ListItemIcon>
      <ListItemText>Descargar PDF</ListItemText>
    </MenuItem>
  );
}
