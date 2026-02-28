import { Box, Chip, Grid, Stack, Typography } from "@mui/material";

import styles from 'src/styles/noScrollbar.module.css';
import AssetShowcase from "../assets/AssetShowcase";
import ParentsTranslationService from "services/translation/parents";
import { capitalize } from "lodash";

export default function ActivityCardForParents({ activity, onSelect }) {
  const {
    name,
    recommendedLevels,
    cores,
    descriptionForParents,
    assets,
    materials,
  } = activity

  return (
    <Box mb={2}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Typography variant="h6">{name}</Typography>
      </Stack>
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
        className={styles.noScrollbar}
        mb={4}
      >
        <Chip
          color="warning"
          size="small"
          label={ParentsTranslationService.getAgesFromLevels(recommendedLevels)}
        />
        {cores.map((core) => (
          <Chip
            key={core.name}
            color="info"
            size="small"
            label={ParentsTranslationService.coresTranslations[core.name]}
          />
        ))}
      </Stack>
      <Box>
        <Box
          fontSize={12}
          mb={4}
          dangerouslySetInnerHTML={{ __html: descriptionForParents }}
        />
        {materials.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Materiales</Typography>
            {materials.map((material, i) => (
              <Stack key={material.name} direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" flex={2}>{i + 1}. {capitalize(material.name)} {material.quantityText}</Typography>
              </Stack>
            ))}
          </Box>
        )}
        {Object.keys(assets).length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Material digital</Typography>
            <AssetShowcase assets={assets} thumbnails withDownload />
          </Box>
        )}
      </Box>
    </Box>
  );
};