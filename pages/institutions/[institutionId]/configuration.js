import { getClassesByInstitution } from "db/class";
import { getCores } from "db/core";
import { getCurricularObjectivesByInstitution } from "db/curricularObjectives";
import { getInstitutionWithConfiguration } from "db/institution"
import { getNonHeterogeneousLevels } from "db/level";
import { getObjectivesByInstitution } from "db/objective";
import { getAllStudentsForInstitution } from "db/student";
import { getSubObjectivesForInstitution } from "db/subObjectives";
import { getInstitutionCoordinators, getInstitutionPrincipals, getInstitutionTeachers } from "db/user";
import { isAuthorized } from "services/Authorization";
import ConfigureInstitutionContainer from "src/components/institution/configuration/Container";
import { InstitutionConfigurationContextProvider } from "src/context/InstitutionConfigurationContext";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user } = session;
  const { params: { institutionId } } = context;
  const institutionWithConfigs = await getInstitutionWithConfiguration(institutionId);
  const teachers = await getInstitutionTeachers(institutionId);
  const coordinators = await getInstitutionCoordinators(institutionId);
  const principals = await getInstitutionPrincipals(institutionId);
  const configuredPrincipalId = institutionWithConfigs?.configuration?.employeesRoles?.principal?.id;
  const principal = principals.find(({ id }) => id === configuredPrincipalId)
    || principals[0]
    || null;
  const allEmployees = [...teachers, ...coordinators];
  const allClassrooms = await getClassesByInstitution(institutionId);
  const allLevels = await getNonHeterogeneousLevels();
  const allSubObjectives = await getSubObjectivesForInstitution(institutionId);
  const allCores = await getCores(institutionId);
  const allCurricularObjectives = await getCurricularObjectivesByInstitution(institutionId);
  const allStudents = await getAllStudentsForInstitution(institutionId);

  return {
    props: serializeForNextProps({
      institutionId,
      principal,
      allEmployees,
      user,
      allClassrooms,
      allLevels,
      allSubObjectives,
      allCores,
      allCurricularObjectives,
      allStudents,
      institution: institutionWithConfigs,
    }),
  };
}

export default function InstitutionConfiguration(props) {
  return (
    <InstitutionConfigurationContextProvider { ...props }>
      <ConfigureInstitutionContainer />
    </InstitutionConfigurationContextProvider>
  )
}