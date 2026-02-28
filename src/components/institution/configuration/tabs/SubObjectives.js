import axios from "axios";
import React, { useContext } from "react";
import SubObjectivesTable from "src/components/subObjectives/SubObjectivesTable";
import UngaCircularProgress from "src/components/utils/UngaCircularProgress";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import useSWR from "swr";

export default function SubObjectivesConfiguration() {
  const {
    allSubObjectives,
    allowedClassrooms,
    institutionId,
    allCores,
    allCurricularObjectives,
  } = useContext(InstitutionConfigurationContext);
  const { data: allObjectivesResponse } = useSWR(`/api/institutions/${institutionId}/objectives`, axios)

  if (!allObjectivesResponse) return <UngaCircularProgress />

  return (
    <SubObjectivesTable
      allObjectives={allObjectivesResponse.data}
      allSubObjectives={allSubObjectives}
      allCores={allCores}
      allCurricularObjectives={allCurricularObjectives}
      allowedClassrooms={allowedClassrooms}
      institutionId={institutionId}
    />
  );
}