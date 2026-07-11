import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useState, createContext, useEffect } from 'react';

export const AdvancedReportContext = createContext({});

export function AdvancedReportContextProvider({ children }) {
  const { query: { classroomId, studentId } } = useRouter();
  const [showSubObjectives, setShowSubObjectives] = useState(false);
  const [reportOptions, setReportOptions] = useState({});
  const [allObjectives, setAllObjectives] = useState([]);
  const [hiddenObjectives, setHiddenObjectives] = useState([]);
  const [levelNotToShow, setLevelNotToShow] = useState('');
  const [printing, setPrinting] = useState(false);
  const [activeTimePeriods, setActiveTimePeriods] = useState({});
  const [classroomReportConfiguration, setClassroomReportConfiguration] = useState({});
  const [readOnly, setReadOnly] = useState(false);
  const [student, setStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evaluatedObjective, setEvaluatedObjective] = useState(null);

  useEffect(() => {
    if (reportOptions?.hiddenObjectives) {
      setHiddenObjectives(reportOptions.hiddenObjectives || [])
    }
    setLoading(false);
  }, [reportOptions])

  const toggleHideObjective = async (objective) => {
    try {
      const response = await axios.patch(`/api/classrooms/${classroomId}/students/${studentId}/reports-options/${reportOptions.id}`, {
        hideObjective: objective,
      });
      setReportOptions(response.data);
      return true;
    } catch (e) {
      return false;
    }
  }

  const toggleHideTimePeriod = async (timePeriod) => {
    try {
      const response = await axios.patch(`/api/classrooms/${classroomId}/students/${studentId}/reports-options/${reportOptions.id}`, {
        hideTimePeriod: timePeriod,
      });
      setReportOptions(response.data);
      return true;
    } catch (e) {
      return false;
    }
  }

  const addObjectiveToOptions = async (objective) => {
    const response = await axios.patch(`/api/classrooms/${classroomId}/students/${studentId}/reports-options/${reportOptions.id}`, {
      addObjective: objective,
    });
    setReportOptions(response.data);
  }

  return (
    <AdvancedReportContext.Provider value={{
      reportOptions,
      setReportOptions,
      allObjectives,
      setAllObjectives,
      addObjectiveToOptions,
      toggleHideObjective,
      hiddenObjectives,
      setLevelNotToShow,
      levelNotToShow,
      toggleHideTimePeriod,
      printing,
      setPrinting,
      activeTimePeriods,
      setActiveTimePeriods,
      classroomReportConfiguration,
      setClassroomReportConfiguration,
      readOnly,
      setReadOnly,
      showSubObjectives,
      setShowSubObjectives,
      student,
      setStudent,
      evaluatedObjective,
      setEvaluatedObjective,
    }}>
      {loading ? null : children}
    </AdvancedReportContext.Provider>
  )
}