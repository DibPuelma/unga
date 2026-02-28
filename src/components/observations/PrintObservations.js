import { Stack, Typography } from "@mui/material";
import moment from "moment-timezone";
import UngaRatioImage from "../utils/UngaRatioImage";
import { orderBy } from "lodash";
import { useEffect, useState } from "react";
import { arrayToListText } from "src/helpers/arrays";

export default function PrintObservations({ observations }) {
  return (
    <Stack rowGap={4}>
      {orderBy(observations, 'observedAt', 'asc').map((observation) => (
        <Stack key={observation.id}>
          <Typography variant="h6" gutterBottom>{moment(observation.observedAt).format('DD [de] MMMM [de] YYYY')}</Typography>
          <Stack rowGap={2} mb={2}>
            {Object.values(observation.assets).filter((asset) => asset.resource_type === 'image').map((asset) => (
              <UngaRatioImage
                priority
                key={asset.asset_id}
                image={asset}
                baseHeight={200}
                borderRadius={2}
              />
            ))}
          </Stack>
          <Typography variant="body2">{observation.description}</Typography>
          <Typography variant="subtitle2" color="gray">
            {arrayToListText(observation.students.map((student) => (
              `${student.firstName} ${student.lastName}`
            )))}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}