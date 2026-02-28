import { isAuthorized } from "services/Authorization";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { DeleteOutlined, DriveFileRenameOutline, EditOutlined } from "@mui/icons-material";
import { useContext, useState } from "react";
import CloudinaryUploadWidget from "src/components/utils/CloudinaryUploadWidget";
import axios from "axios";
import { LoadingButton } from "@mui/lab";
import Head from "next/head";
import UngaRatioImage from "src/components/utils/UngaRatioImage";
import { signOut } from "next-auth/react";
import { UserContext } from "src/context/UserContext";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user } = await getServerSession(context.req, context.res, authOptions);

  return {
    props: serializeForNextProps({
      user,
    })
  }
}

export default function Profile({ user }) {
  const { clearContext } = useContext(UserContext);
  const [personalData, setPersonalData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    edit: false,
    loading: false,
  });
  const [assets, setAssets] = useState({
    profilePicture: {
      data: user.profilePicture,
      loading: false,
    },
    signature: {
      data: user.signature,
      loading: false,
    }
  })
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountInput, setDeleteAccountInput] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [showDeleteAccountInputError, setShowDeleteAccountInputError] = useState(false);
  const [axiosError, setAxiosError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const patchUser = (id, data) => axios.patch(`/api/users/${id}`, data);

  const handleEditPersonalData = () => {
    setPersonalData((oldData) => ({ ...oldData, edit: !oldData.edit }));
  }

  const handleSavePersonalData = () => {
    const { lastName, firstName } = personalData;
    setPersonalData((oldData) => ({ ...oldData, loading: true }))
    patchUser(user.id, { lastName, firstName })
      .then(() => setPersonalData((oldData) => ({ ...oldData, edit: false })))
      .catch(() => setAxiosError('No pudimos actualizar tus datos'))
      .finally(() => setPersonalData((oldData) => ({ ...oldData, loading: false })))
  }

  const handlePersonalDataChange = ({ target: { value, name } }) => {
    setPersonalData((oldData) => ({ ...oldData, [name]: value }));
  }

  const handleSnackbarClose = () => setAxiosError('');

  const handleAssetChange = async (path, assetObject) => {
    handleSnackbarClose();
    // Assets are an object.
    // This is a single input, therefore position 0 will always be the only asset uploaded
    const asset = Object.values(assetObject)[0];
    setAssets((oldData) => ({
      ...oldData,
      [path]: {
        loading: true,
        data: null
      }
    }))
    try {
      await patchUser(user.id, { [path]: asset || null });
      setAssets((oldData) => ({
        ...oldData,
        [path]: {
          loading: false,
          data: asset
        }
      }))
    } catch (e) {
      setAxiosError(`No pudimos actualizar tu ${path === 'signature' ? 'firma' : 'foto de perfil'}`)
    } finally {
      setAssets((oldData) => ({
        ...oldData,
        [path]: {
          ...oldData[path],
          loading: false,
        }
      }))
    }
  }

  const handleDeleteAsset = async (path) => {
    handleSnackbarClose();
    setDeleteLoading(true);
    // Empty object sends undefined
    await handleAssetChange(path, {});
    setDeleteLoading(false);
  }

  const handleOpenDeleteAccountModal = () => {
    setDeleteAccountModalOpen(true);
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountInput !== user.id) {
      setShowDeleteAccountInputError(true);
      return;
    }
    setShowDeleteAccountInputError(false);
    setDeleteAccountLoading(true);
    try {
      await axios.delete(`/api/users/${user.id}`)
      clearContext();
      signOut({ callbackUrl: '/deleted-user' });
    } finally {
      setDeleteAccountLoading(false);
    }
  }

  return (
    <>
      <Head><title>Tu perfil</title></Head>
      <Container maxWidth="sm">
        <Stack spacing={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Foto de perfil</Typography>
            <Typography fontSize={12} mb={2}>Formato png o jpeg</Typography>
            {assets.profilePicture.data?.url && (
              <UngaRatioImage
                priority
                image={assets.profilePicture.data}
                baseHeight={150}
              />
            )}
            <Stack direction="row" spacing={2}>
              <CloudinaryUploadWidget
                buttonTitle={assets.profilePicture.data?.url ? 'Cambiar foto' : 'Agregar foto'}
                buttonIcon={<DriveFileRenameOutline />}
                withoutShowcase
                onAssetChange={(assetObject) => handleAssetChange('profilePicture', assetObject)}
                multiple={false}
                allowedFormats={['jpeg', 'png']}
                id="profile-picture"
              />
              {assets.profilePicture.data?.url && (
                <LoadingButton
                  startIcon={<DeleteOutlined />}
                  color="error"
                  loading={deleteLoading}
                  onClick={() => handleDeleteAsset('profilePicture')}
                >
                  Eliminar foto
                </LoadingButton>
              )}
            </Stack>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="h6">Datos personales</Typography>
              <IconButton onClick={handleEditPersonalData}>
                <EditOutlined />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" mb={personalData.edit ? 1 : 0}>
              {personalData.edit ? (
                <>
                  <TextField
                    size="small"
                    value={personalData.firstName}
                    name="firstName"
                    label="Nombres"
                    onChange={handlePersonalDataChange}
                  />
                  <TextField
                    size="small"
                    value={personalData.lastName}
                    name="lastName"
                    label="Apellidos"
                    onChange={handlePersonalDataChange}
                  />
                </>
              ) : (
                <Typography>Nombre completo: {personalData.firstName} {personalData.lastName}</Typography>
              )}
            </Stack>
            {personalData.edit && (
              <LoadingButton
                variant="outlined"
                onClick={handleSavePersonalData} sx={{ mt: 2 }}
                loading={personalData.loading}
              >
                Guardar cambios
              </LoadingButton>
            )}
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Firma</Typography>
            <Typography fontSize={12} mb={2}>Formato png o jpeg</Typography>
            {assets.signature.data?.url && (
              <UngaRatioImage
                priority
                image={assets.signature.data}
                baseHeight={150}
              />
            )}
            <Stack direction="row" spacing={2}>
              <CloudinaryUploadWidget
                buttonTitle={assets.signature.data?.url ? 'Cambiar firma' : 'Agregar firma'}
                buttonIcon={<DriveFileRenameOutline />}
                withoutShowcase
                onAssetChange={(assetObject) => handleAssetChange('signature', assetObject)}
                multiple={false}
                allowedFormats={['jpeg', 'png']}
                id="signature"
              />
              {assets.signature.data?.url && (
                <LoadingButton
                  startIcon={<DeleteOutlined />}
                  color="error"
                  loading={deleteLoading}
                  onClick={() => handleDeleteAsset('signature')}
                >
                  Eliminar firma
                </LoadingButton>
              )}
            </Stack>
          </Paper>
          {/* <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Zona de peligro</Typography>
            <Button variant="outlined" color="error" onClick={handleOpenDeleteAccountModal}>
              Eliminar cuenta
            </Button>
          </Paper> */}
        </Stack>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={Boolean(axiosError)}
          onClose={handleSnackbarClose}
          autoHideDuration={5000}
        >
          <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
            {axiosError}
          </Alert>
        </Snackbar>
      </Container>
      <Dialog
        open={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
      >
        <DialogTitle>¿Estás segura que deseas eliminar tu cuenta?</DialogTitle>
        <DialogContent>
          <Typography fontWeight={500} sx={(theme) => ({ color: theme.palette.error.main })}>
            Esta acción no se puede deshacer. Todos tus datos serán eliminados.
          </Typography>
          <Typography mt={4}>
            Escribe el siguiente número para confirmar: <b>{user.id}</b>
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={deleteAccountInput}
            onChange={(e) => setDeleteAccountInput(e.target.value)}
            sx={{ mt: 2 }}
            error={showDeleteAccountInputError}
            helperText={showDeleteAccountInputError ? 'El número no coincide' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountModalOpen(false)}>Cancelar</Button>
          <LoadingButton
            color="error"
            loading={deleteAccountLoading}
            onClick={handleDeleteAccount}
          >
            Eliminar cuenta
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}