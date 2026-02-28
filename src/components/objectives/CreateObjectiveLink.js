import { useContext } from "react";
import { Typography } from "@mui/material";
import Link from "src/Link";
import { UserContext } from "src/context/UserContext";

export default function CreateObjectiveLink() {
  const { institution: { ref: { '@ref': { id: institutionId } } } } = useContext(UserContext);

  return (
    <Link noLinkStyle href={`/institutions/${institutionId}/configuration?tab=3`}>
      <Typography p={1}>No hay indicadores en esos niveles y núcleos, para crear uno haz click aquí</Typography>
    </Link>
  );
}