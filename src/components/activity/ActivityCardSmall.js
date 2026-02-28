import { useContext, useEffect, useMemo, useState } from "react";
import { Box, Checkbox, Chip, IconButton, Menu, Stack, Typography } from "@mui/material";

import styles from 'src/styles/noScrollbar.module.css';
import { MoreVertOutlined } from "@mui/icons-material";
import { UserContext } from "src/context/UserContext";
import { toAcronym } from "src/helpers/strings";
import RatingBadge from "../rating/RatingBadge";
import DuplicateActivityButton from "./DuplicateActivityButton";
import EditActivityButton from "./EditActivityButton";
import SeeActivityDetailsButton from "./SeeActivityDetailsButton";
import DeleteActivityButton from "./DeleteActivityButton";
import ShareActivityToCommunityButton from "./ShareActivityToCommunityButton";
import ActivityCreator from "./ActivityCreator";

export default function ActivityCardSmall({ activity, onSelect, forceCheck, onDelete, watchOnly }) {
  const { user, institution } = useContext(UserContext);
  const [dynamicActivity, setDynamicActivity] = useState(activity);
  const {
    id,
    name,
    recommendedLevels,
    cores,
    publiclyAvailable,
    openToCommunity,
    creatorId = creator?.id,
    creator,
    sponsorInstitution,
    avgRating,
    totalRatings,
    theme,
  } = dynamicActivity
  const [checked, setChecked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const canManage = useMemo(() => (
    sponsorInstitution?.id === institution.id
    && (user.role === 'principal' || user.role === 'coordinator' || creatorId === user.id)
  ), [user, institution, sponsorInstitution, publiclyAvailable, openToCommunity]);
  const canShare = useMemo(() => creatorId === user.id)

  useEffect(() => {
    forceCheck && setChecked(true);
  }, [forceCheck])

  const institutionId = useMemo(() => institution.id, [institution]);

  const handleCheck = ({ target: { checked } }) => {
    setChecked(checked);
    onSelect(checked, activity);
  }

  const handleDelete = () => {
    onDelete(id);
  }

  const handleShare = () => {
    setDynamicActivity((oldActivity) => ({
      ...oldActivity,
      openToCommunity: true,
    }))
  }

  const handleActionsOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActionsClose = () => {
    setAnchorEl(null);
  };

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
        <Stack mb={0.5}>
          {/* {(publiclyAvailable || openToCommunity) && (
          <RatingBadge
            rating={avgRating}
            totalEvaluations={totalRatings}
            documentName={name}
            activity={dynamicActivity}
            detailsPath={`/api/activities/${id}/activity-reviews`}
          />
          )} */}
          <Stack direction="row" spacing={1} alignItems="center">
            {onSelect && (
              <Checkbox
                checked={checked}
                onChange={handleCheck}
                inputProps={{ 'aria-label': 'Select activity' }}
              />
            )}
            <Typography variant="h6">{name}</Typography>
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          {theme && (
            <Box>
              <Chip variant="outlined" color="success" size="small" label={`Temática: ${theme.name.toLowerCase()}`} />
            </Box>
          )}
          <Stack
            gap={1}
            direction="row"
            flexWrap="wrap"
            maxWidth="100%"
            alignItems="center"
            overflow="scroll"
            className={styles.noScrollbar}
            mb={2}
          >
            {recommendedLevels.map((rl, i) => (
              <Chip title={rl.name} key={rl.name} color="warning" size="small" label={toAcronym(rl.name)} />
            ))}
            {cores.map((core, i) => (
              <Chip
                key={core.name}
                color="info"
                size="small"
                label={toAcronym(core.name)}
                title={core.name}
              />
            ))}
          </Stack>
        </Stack>
      </Box>
      <Stack direction="row" gap={2} justifyContent="space-between" mt={2}>
        <SeeActivityDetailsButton activity={activity} />
        {!watchOnly && (
          <>
            <IconButton onClick={handleActionsOpen}>
              <MoreVertOutlined fontSize="small" />
            </IconButton>
            <Menu
              sx={{ mt: 1 }}
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleActionsClose}
            >
              {canShare && <ShareActivityToCommunityButton activity={activity} onShare={handleShare} />}
              <DuplicateActivityButton
                activityId={id}
                publiclyAvailable={publiclyAvailable}
                openToCommunity={openToCommunity}
                institutionId={institutionId}
              />
              {canManage && <EditActivityButton activity={activity} institutionId={institutionId} />}
              {canManage && <DeleteActivityButton activityId={id} institutionId={institutionId} onDelete={handleDelete} />}
            </Menu>
          </>
        )}
      </Stack>
      <ActivityCreator activity={dynamicActivity} />
    </Box>
  );
};