import React, { useContext } from 'react';
import { Chip } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useRouter } from 'next/router';
import useCredits from 'src/hooks/useCredits';
import { UserContext } from 'src/context/UserContext';

// Remaining AI credits, visible for B2C users only. Links to the plan page.
export default function CreditsChip() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { credits, isB2C } = useCredits();

  if (!isB2C || !credits) return null;

  return (
    <Chip
      icon={<BoltIcon sx={{ fill: 'white' }} />}
      label={`${credits.remaining} créditos`}
      onClick={() => router.push(`/users/${user.id}/current-plan`)}
      sx={{
        color: 'white',
        bgcolor: 'rgba(255,255,255,0.2)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
        fontWeight: 600,
        flexShrink: 0,
      }}
    />
  );
}
