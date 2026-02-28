import { Grid } from "@mui/material"
import Signature from "./Signature"
import { useContext, useMemo } from "react"
import { AdvancedReportContext } from "src/context/AdvancedReportContext"

export default function Signatures({ signers, mainTeacher, coordinator, principal, currentUser }) {
  const { printing } = useContext(AdvancedReportContext);
  const signersCount = useMemo(() => signers ? Object.values(signers).filter((signer) => signer).length : 0, [signers]);
  
  if (signers) return (
    <Grid
      container
      spacing={6}
      justifyContent="center"
    >
      {signers.teacher && (
        <Grid item xs={printing ? 12 / signersCount : 12} sm={12 / signersCount}>
          <Signature
            noSignerText="Firma educadora"
            signer={mainTeacher}
            isCurrentUser={currentUser.id === mainTeacher?.id}
          />
        </Grid>
      )}
      {signers.coordinator && (
        <Grid item xs={printing ? 12 / signersCount : 12} sm={12 / signersCount}>
          <Signature
            signer={coordinator}
            isCurrentUser={currentUser.id === coordinator?.id}
          />
        </Grid>
      )}
      {signers.principal && (
        <Grid item xs={printing ? 12 / signersCount : 12} sm={12 / signersCount}>
          <Signature
            noSignerText="Firma directora"
            signer={principal}
            isCurrentUser={currentUser.id === principal?.id}
          />
        </Grid>
      )}
      {signers.parent && (
        <Grid item xs={printing ? 12 / signersCount : 12} sm={12 / signersCount}>
          <Signature noSignerText="Firma apoderado" />
        </Grid>
      )}
    </Grid>
  )
  return (
    <Grid
      container
      justifyContent="center"
    >
      <Grid item xs={12} sm={4}>
        <Signature
          noSignerText="Firma educadora"
          signer={mainTeacher}
          isCurrentUser={currentUser.id === mainTeacher?.id}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Signature
          noSignerText="Firma directora"
          signer={principal}
          isCurrentUser={currentUser.id === principal?.id}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Signature noSignerText="Firma apoderado" />
      </Grid>
    </Grid>
  )
}