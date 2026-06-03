import { Alert, Box, CircularProgress, IconButton, Snackbar, Avatar as MaterialAvatar } from "@mui/material"
import Avatar from "../user/Avatar"
import { AddAPhotoOutlined } from "@mui/icons-material";
import { useState } from "react";
import CloudinaryUploadWidget from "../utils/CloudinaryUploadWidget";
import axios from "axios";

export default function StudentAvatar({ student }) {
  const [hovering, setHovering] = useState(false);
  const [dynamicStudent, setDynamicStudent] = useState(student);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAssetChange = async (assetObject) => {
    // Assets are an object.
    // This is a single input, therefore position 0 will always be the only asset uploaded
    const asset = Object.values(assetObject)[0];
    try {
      setError('');
      setLoading(true);
      const newStudentResponse = await axios.patch(`/api/classrooms/${student.classroomId || student.classId}/students/${student.id}`, {
        profilePicture: asset,
      });
      setDynamicStudent(newStudentResponse.data)
    } catch (e) {
      console.error(e);
      setError('No pudimos actualizar la foto. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      position="relative"
      sx={{ mx: 2, cursor: 'pointer' }}
    >
      <Avatar
        user={dynamicStudent}
        size={50}
      />
      {loading && (
        <MaterialAvatar sx={{ width: 50, height: 50, position: 'absolute', top: 0, zIndex: 5 }}>
          <CircularProgress size={16} />
        </MaterialAvatar>
      )}
      {hovering && (
        <>
          <MaterialAvatar sx={{ width: 50, height: 50, position: 'absolute', top: 0, zIndex: 2 }}>
            <IconButton id="upload_widget">
              <AddAPhotoOutlined />
            </IconButton>
          </MaterialAvatar>
          <CloudinaryUploadWidget
            id="upload_widget"
            withoutButton
            onAssetChange={handleAssetChange}
            multiple={false}
            allowedFormats={['jpeg', 'png']}
          />
        </>
      )
      }
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={Boolean(error)}
        onClose={() => setError('')}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box >
  )
}