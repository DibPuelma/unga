import React, { useContext } from "react";
import StudentsTable from "src/components/students/StudentsTable";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";

export default function StudentsConfiguration() {
  const {
    allStudents,
    allowedClassrooms,
    institutionId,
  } = useContext(InstitutionConfigurationContext);

  return (
    <StudentsTable
      students={allStudents}
      allowedClassrooms={allowedClassrooms}
      institutionId={institutionId}
    />
  );
}