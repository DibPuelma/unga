import { Box, Chip, Stack, Typography } from "@mui/material";
import SeeActivityDetailsButton from "./SeeActivityDetailsButton";
import ParentsTranslationService from "services/translation/parents";

export default function ActivityCardSmallForParents({ activity, onShow, onClose, activityModalOpen }) {
  const {
    name,
    recommendedLevels,
    cores,
  } = activity

  return (
    <Box
      border={(theme) => `1px solid ${theme.palette.grey[600]}`}
      borderRadius={2}
      height="100%"
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{name}</Typography>
          </Stack>
        </Stack>
        <Stack rowGap={1}>
          <Stack direction="row" gap={1}>
            <Chip
              color="warning"
              size="small"
              label={ParentsTranslationService.getAgesFromLevels(recommendedLevels)}
            />
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {cores.map((core, i) => (
              <Chip
                key={core.name}
                color="info"
                size="small"
                label={ParentsTranslationService.coresTranslations[core.name]}
              />
            ))}
          </Stack>
        </Stack>
      </Box>
      <Stack mt={2}>
        <SeeActivityDetailsButton forceModalOpen={activityModalOpen} onShow={onShow} onClose={onClose} activity={activity} forParents />
      </Stack>
    </Box>
  );
};