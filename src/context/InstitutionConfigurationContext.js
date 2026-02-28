import React, { useState, createContext, useMemo } from 'react';
import { getEditAccessClassrooms } from 'src/helpers/businessLogic';

export const InstitutionConfigurationContext = createContext();

const DEFAULT_REPORT_CONFIG = {
  signers: {
    principal: true,
    teacher: true,
    coordinator: false,
    parent: true,
  },
  showLevelOfAchievementDescription: false,
};

const DEFAULT_ACTIVITIES_CONFIG = {
  evaluationType: 'BOTH',
}

const DEFAULT_PRINT_CONFIG = {
  size: 'letter',
};

export function InstitutionConfigurationContextProvider({
  institutionId,
  principal,
  allEmployees: propsAllEmployees,
  institution,
  user,
  children,
  allClassrooms,
  allObjectives,
  allSubObjectives,
  allCores,
  allCurricularObjectives,
  allStudents,
}) {
  const [reportConfig, setReportConfig] = useState(
    institution.configuration?.report || DEFAULT_REPORT_CONFIG
  );
  const [employeesRolesConfig, setEmployeesRolesConfig] = useState(
    institution.configuration?.employeesRoles ? {
      principal: institution.configuration.employeesRoles.principal?.id,
      coordinator: institution.configuration.employeesRoles.coordinator?.id,
    } : null
  );
  const [activitiesConfig, setActivitiesConfig] = useState(
    institution.configuration?.activities || DEFAULT_ACTIVITIES_CONFIG
  );
  const [allEmployees, setAllEmployees] = useState(propsAllEmployees);
  const [printConfig, setPrintConfig] = useState(institution.configuration?.print || DEFAULT_PRINT_CONFIG)
  const [institutionFormData, setInstitutionFormData] = useState({
    name: institution.name,
    address: institution.address,
    code: institution.code,
    junjiCode: institution.junjiCode,
    mobilePhone: institution.mobilePhone,
    email: institution.email,
    webpage: institution.webpage,
    logo: institution.logo,
  });
  const allowedClassrooms = useMemo(() => getEditAccessClassrooms(user, allClassrooms), [user, allClassrooms]);

  return (
    <InstitutionConfigurationContext.Provider value={{
      user,
      principal,
      institutionId,
      allClassrooms,
      allowedClassrooms,
      allObjectives,
      allSubObjectives,
      reportConfig,
      setReportConfig,
      employeesRolesConfig,
      setEmployeesRolesConfig,
      allEmployees,
      setAllEmployees,
      activitiesConfig,
      setActivitiesConfig,
      institutionFormData,
      setInstitutionFormData,
      printConfig,
      setPrintConfig,
      allCores,
      allCurricularObjectives,
      allStudents,
    }}>
      {children}
    </InstitutionConfigurationContext.Provider>
  )
}