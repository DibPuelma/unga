import { Box, Breadcrumbs, Button, Card, CardContent, Divider, Stack, TextField, Typography, Alert, Snackbar } from "@mui/material";
import { getInstitution } from "db/institution";
import { isAuthorized } from "services/Authorization";
import Head from "next/head";
import Link from "next/link";
import { serializeForNextProps } from "src/helpers/businessLogic";
import { useState } from "react";
import axios from "axios";
import { LoadingButton } from "@mui/lab";
import { DownloadOutlined, UploadOutlined } from "@mui/icons-material";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { params: { institutionId } } = context;
  const institution = await getInstitution(institutionId);

  if (!institution) {
    return {
      notFound: true,
    };
  }

  return {
    props: serializeForNextProps({
      institution,
      institutionId,
    }),
  };
}

function UploadSection({ title, uploadEndpoint, templateEndpoint, institutionId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleDownloadTemplate = () => {
    window.open(`/api/super-admin/institutions/${institutionId}/templates/${templateEndpoint}`, '_blank');
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setMessage({ type: '', text: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo' });
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `/api/super-admin/institutions/${institutionId}/upload/${uploadEndpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { successful, failed, message: responseMessage } = response.data;
      const successText = `${responseMessage}. Exitosos: ${successful}, Fallidos: ${failed}`;
      
      setMessage({ type: 'success', text: successText });
      setOpenSnackbar(true);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById(`file-input-${uploadEndpoint}`);
      if (fileInput) fileInput.value = '';
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al subir el archivo';
      setMessage({ type: 'error', text: errorMessage });
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={handleDownloadTemplate}
        >
          Descargar Plantilla
        </Button>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadOutlined />}
        >
          Seleccionar Archivo
          <input
            type="file"
            accept=".xlsx,.xls,.csv,text/csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id={`file-input-${uploadEndpoint}`}
          />
        </Button>
        {file && (
          <Typography variant="body2" color="text.secondary">
            {file.name}
          </Typography>
        )}
        <LoadingButton
          variant="contained"
          loading={loading}
          onClick={handleUpload}
          disabled={!file}
        >
          Subir
        </LoadingButton>
      </Stack>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={message.type === 'error' ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function InstitutionDetail({ institution, institutionId }) {
  const navigationLinks = [
    { label: 'Usuarios', href: `/super-admin/institutions/${institutionId}/users` },
    { label: 'Salas', href: `/super-admin/institutions/${institutionId}/classrooms` },
    { label: 'Núcleos', href: `/super-admin/institutions/${institutionId}/cores` },
    { label: 'Niveles de Logro', href: `/super-admin/institutions/${institutionId}/levels-of-achievement` },
    { label: 'Actividades', href: `/super-admin/institutions/${institutionId}/activities` },
  ];

  return (
    <>
      <Head>
        <title>{institution.name || 'Institución'}</title>
      </Head>
      <Stack spacing={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/super-admin/pmf-answers" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Super Admin</Typography>
          </Link>
          <Link href="/super-admin/institutions" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Instituciones</Typography>
          </Link>
          <Typography color="text.primary">{institution.name || 'Institución'}</Typography>
        </Breadcrumbs>
        <Box>
          <Typography variant="h4" gutterBottom>
            {institution.name || 'Sin nombre'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Código: {institution.code || '-'} | País: {institution.country || '-'}
          </Typography>
          {institution.address && (
            <Typography variant="body2" color="text.secondary">
              Dirección: {institution.address}
            </Typography>
          )}
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Navegación
            </Typography>
            <Stack spacing={2} mt={2}>
              {navigationLinks.map((link) => (
                <Link key={link.href} href={link.href} passHref>
                  <Button variant="outlined" fullWidth>
                    {link.label}
                  </Button>
                </Link>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Carga Masiva de Datos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Descarga las plantillas, complétalas con los datos y súbelas aquí para crear registros de forma masiva.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <UploadSection
              title="Usuarios"
              uploadEndpoint="users"
              templateEndpoint="users"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Salas"
              uploadEndpoint="classrooms"
              templateEndpoint="classrooms"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Estudiantes"
              uploadEndpoint="students"
              templateEndpoint="students"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Núcleos"
              uploadEndpoint="cores"
              templateEndpoint="cores"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Objetivos y Sub-objetivos (Combinado)"
              uploadEndpoint="objectives-and-sub-objectives"
              templateEndpoint="objectives-and-sub-objectives"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Objetivos"
              uploadEndpoint="objectives"
              templateEndpoint="objectives"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Sub-objetivos"
              uploadEndpoint="sub-objectives"
              templateEndpoint="sub-objectives"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Niveles de Logro"
              uploadEndpoint="levels-of-achievement"
              templateEndpoint="levels-of-achievement"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Eventos del Calendario"
              uploadEndpoint="calendar-events"
              templateEndpoint="calendar-events"
              institutionId={institutionId}
            />
            <Divider sx={{ my: 2 }} />
            <UploadSection
              title="Objetivos Curriculares"
              uploadEndpoint="curricular-objectives"
              templateEndpoint="curricular-objectives"
              institutionId={institutionId}
            />
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}

