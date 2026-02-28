import React from 'react';
import { useSession } from 'next-auth/react';
import { LinearProgress } from '@mui/material';

export default function Auth({ children }) {
  const { data: session, status } = useSession({ required: true })
  const isUser = !!session?.user

  if (isUser) {
    return children
  }

  if (status === 'loading') {
    return <LinearProgress />;
  }

  // Session is being fetched, or no user.
  // If no user, useEffect() will redirect.
}