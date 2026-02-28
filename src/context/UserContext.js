import React, { useState, createContext, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { LinearProgress } from '@mui/material';
import { getClassroomsIdsByLevelId, noInstitution, outsideApp } from 'src/helpers/businessLogic';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const session = useSession()
  const [levelsOfAchievement, setLevelsOfAchievement] = useState();
  const [selectedClassroom, setSelectedClassroom] = useState();
  const [user, setUser] = useState();
  const [institution, setInstitution] = useState();
  const [totalActivitiesCreated, setTotalActivitiesCreated] = useState(0);
  const [loading, setLoading] = useState(true);
  const classroomsIdsByLevelId = useMemo(() => (
    getClassroomsIdsByLevelId(user, institution)
  ), [user, institution]);
  const userHasPlan = useMemo(() => user && (user.plan !== 'trial' || user.trialEndsAt), [user]);


  // Effect to handle session and initial loading state
  useEffect(() => {
    // Fallback timeout - if session never resolves, stop loading after 5 seconds
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    if (session.status === 'loading') {
      // Session is still loading, wait for it but keep fallback timeout
      return () => clearTimeout(fallbackTimeout);
    }
    
    // Clear fallback since session resolved
    clearTimeout(fallbackTimeout);
    
    // Session has resolved, check if we have a valid user
    const user = session.data?.user;
    if (!session.data || !user || outsideApp(user) || noInstitution(user)) {
      // No valid session/user, stop loading immediately
      setLoading(false);
      return;
    }

    // Valid user found, stop loading
    setLoading(false);
  }, [session])

  // Separate effect to fetch levelsOfAchievement when we have a valid user
  useEffect(() => {
    if (session.status === 'loading' || !session.data?.user) return;
    
    const user = session.data.user;
    if (outsideApp(user) || noInstitution(user)) return;

    if (!levelsOfAchievement || levelsOfAchievement.length === 0) {
      axios.get('/api/level-of-achievement')
        .then((response) => {
          const apiLevelsOfAchievement = response.data;
          setLevelsOfAchievement(apiLevelsOfAchievement.sort((a, b) => a.value - b.value));
        })
        .catch((error) => {
          console.error('Error fetching levelsOfAchievement:', error)
        });
    }
  }, [session, levelsOfAchievement])

  useEffect(() => {
    const localStorageClassroom = JSON.parse(localStorage.getItem('selectedClassroom'));
    if (!localStorageClassroom?.level) return;

    if (!selectedClassroom && localStorageClassroom) {
      setSelectedClassroom(localStorageClassroom);
    }
  }, [])

  const finishTour = async (tourKey = 'finishedTour') => {
    await axios.patch(`/api/users/${user.id}`, {
      [tourKey]: true
    });
    setUser({
      ...user,
      [tourKey]: true,
    })
  }


  if (loading) return <LinearProgress />

  return (
    <UserContext.Provider value={{
      levelsOfAchievement,
      selectedClassroom,
      setLevelsOfAchievement: (_levelsOfAchievement) => {
        setLevelsOfAchievement(_levelsOfAchievement)
      },
      setSelectedClassroom: (classroom) => {
        setSelectedClassroom(classroom);
        localStorage.setItem('selectedClassroom', JSON.stringify(classroom));
      },
      clearContext: () => {
        setLevelsOfAchievement(null);
        localStorage.setItem('levelsOfAchievement', null)
      },
      user,
      setUser,
      institution,
      setInstitution,
      classroomsIdsByLevelId,
      userHasPlan,
      finishTour,
      totalActivitiesCreated,
      setTotalActivitiesCreated,
    }}>
      {children}
    </UserContext.Provider>
  )
}
