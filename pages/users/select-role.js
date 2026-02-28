import { Stack, Paper, Typography, Container } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { isAuthorized } from "services/Authorization";
import UngaCircularProgress from "src/components/utils/UngaCircularProgress";
import { UserContext } from "src/context/UserContext";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  return {
    props: {},
  }
}

export default function SelectRole() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSetRole = async (role) => {
    setLoading(true);
    await axios.patch(`/api/users/${user.id}`, { role });
    router.replace('/');
  }

  if (loading) {
    return <UngaCircularProgress />
  }

  return (
    <Container maxWidth="sm" sx={{ pt: '10%' }}>
      <Stack>
        <Typography variant="h4" gutterBottom mb={4}>
          ¿Eres educadora o padre?
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleSetRole('teacher')}>
            <Typography variant="h6" gutterBottom>
              Soy Educadora
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleSetRole('parent')}>
            <Typography variant="h6" gutterBottom>
              Soy Mamá o Papá
            </Typography>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  )
}