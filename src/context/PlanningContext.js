import React, { useState, createContext } from 'react';

export const PlanningContext = createContext({});

export function PlanningContextProvider({ children }) {
  const [plannedActivityToEvaluate, setPlannedActivityToEvaluate] = useState(null);

  return (
    <PlanningContext.Provider value={{
      plannedActivityToEvaluate,
      setPlannedActivityToEvaluate,
    }}>
      {children}
    </PlanningContext.Provider>
  )
}