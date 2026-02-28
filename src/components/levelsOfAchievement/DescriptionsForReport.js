import { Grid, Typography } from "@mui/material";
import { useContext } from "react";
import { UserContext } from "src/context/UserContext";
import { getLevelOfAchievementValueColor } from "src/helpers/businessLogic";
import { toAcronym } from "src/helpers/strings";

export default function DescriptionForReport() {
  const { levelsOfAchievement } = useContext(UserContext);

  return (
    <Grid container columns={levelsOfAchievement.length}>
      {levelsOfAchievement.map((loa) => {
        const color = getLevelOfAchievementValueColor(loa.value, levelsOfAchievement.length - 1);
        return (
          <Grid
            key={loa.id}
            item
            xs={1}
            justifyContent="center"
            pt={1}
            px={2}
            color={color}
          >
            <Typography variant="h3" textAlign="center" color={color}>
              <b>{toAcronym(loa.name)}</b>
            </Typography>
            <Typography variant="body2" textAlign="center">
              <b>{loa.name}</b>
            </Typography>
            <Typography fontSize={12} textAlign="center">{loa.description}</Typography>
          </Grid>
        )
      })}
    </Grid>
  )
}