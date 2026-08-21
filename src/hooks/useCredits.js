import { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from 'src/context/UserContext';
import { isB2CPlan } from 'src/helpers/plans';

export default function useCredits() {
  const { user } = useContext(UserContext);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);

  const isB2C = user && isB2CPlan(user.plan);

  const refresh = useCallback(async () => {
    if (!user?.id || !isB2C) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/users/${user.id}/credits`);
      setCredits(data);
    } catch (_) {
      // keep last known value
    } finally {
      setLoading(false);
    }
  }, [user?.id, isB2C]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { credits, loading, refresh, isB2C };
}
