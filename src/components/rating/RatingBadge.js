import { Close } from "@mui/icons-material";
import { Box, Dialog, IconButton, Rating, Stack, Typography, useMediaQuery } from "@mui/material";
import { useMemo, useState } from "react";
import RatingDetails from "./RatingDetails";
import ActivityReview from "../activity/ActivityReview";

export default function RatingBadge({
  rating,
  totalEvaluations,
  documentName,
  detailsPath,
  activity
}) {
  const [openRatingModal, setOpenRatingModal] = useState(false);
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const parsedRating = useMemo(() => rating ?? 0, [rating]);
  const parsedTotalEvaluations = useMemo(() => totalEvaluations ?? 0, [totalEvaluations]);

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        columnGap={1}
        sx={{ cursor: 'pointer' }}
        onClick={() => setOpenRatingModal(true)}
      >
        <Stack direction="row" alignItems="center" columnGap={1}>
          <Typography variant="caption" color="GrayText">{parsedRating?.toFixed(1)}</Typography>
          <Rating size="small" max={5} readOnly value={parsedRating} />
          <Typography variant="caption" color="GrayText">({parsedTotalEvaluations})</Typography>
        </Stack>
        {!rating && <Typography variant="caption" sx={(theme) => ({ color: theme.palette.warning.main })}>¡Se la primera en evaluar!</Typography>}
      </Stack>
      <Dialog
        fullWidth={smUp}
        fullScreen={!smUp}
        open={openRatingModal}
        onClose={() => setOpenRatingModal(false)}
      >
        <Stack p={4} pt={6} position="relative" rowGap={6}>
          <RatingDetails avgRating={parsedRating} name={documentName} path={detailsPath} />
          <ActivityReview
            refetchPath={detailsPath}
            activity={activity}
            onClose={() => setOpenRatingModal(false)}
          />
          <IconButton
            onClick={() => setOpenRatingModal(false)}
            sx={{ position: 'absolute', right: 5, top: 5 }}
          >
            <Close color="error" />
          </IconButton>
        </Stack>
      </Dialog>
    </>
  )
}