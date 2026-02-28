import axios from "axios";
import React, { useContext } from "react";
import ObjectivesTable from "src/components/objectives/ObjectivesTable";
import UngaCircularProgress from "src/components/utils/UngaCircularProgress";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import useSWR from "swr";

export default function ObjectivesConfiguration() {
  const {
    allowedClassrooms,
    institutionId,
    allCores,
    allCurricularObjectives,
  } = useContext(InstitutionConfigurationContext);
  const { data: allObjectivesResponse } = useSWR(`/api/institutions/${institutionId}/objectives`, axios)

  if (!allObjectivesResponse) return <UngaCircularProgress />

  return (
    <ObjectivesTable
      objectives={allObjectivesResponse.data}
      allCores={allCores}
      allCurricularObjectives={allCurricularObjectives}
      allowedClassrooms={allowedClassrooms}
      institutionId={institutionId}
    />
  );
}