import { Stack, Typography } from "@mui/material";
import Avatar from "../user/Avatar";
import { useContext } from "react";
import { UserContext } from "src/context/UserContext";
import moment from "moment-timezone";

export default function ActivityCreator({ activity, size = 'small' }) {
  const sizeToPx = {
    small: 16,
    medium: 32,
    large: 48,
  }
  const sizeToTypographyVariant = {
    small: 'caption',
    medium: 'h6',
    large: 'h5',
  }
  const { user } = useContext(UserContext);
  const {
    creator,
    creatorId = creator?.id,
    originalCreator,
    sponsorInstitution,
    originalSponsorInstitution,
    publiclyAvailable,
    createdAt,
  } = activity;

  console.log({ activity })
  const getCreatorText = () => {
    if (originalCreator && originalSponsorInstitution) {
      if (originalCreator.id === user.id) return 'Creada por ti';
      if (originalCreator.id !== user.id && creatorId === user.id) return `Creada por ${creator.firstName} ${creator.lastName} de ${sponsorInstitution.name}, duplicada por ti`;
      return `Creada por ${originalCreator.firstName} ${originalCreator.lastName} de ${originalSponsorInstitution.name}`;
    }
    if (creatorId === user.id) return 'Creada por ti';
    if (publiclyAvailable) return `Creada por ${creator.firstName} ${creator.lastName} de ${sponsorInstitution.name}`;;
    return `Creada por ${creator.firstName} ${creator.lastName}`;
  }

  const CreatorAvatar = () => {
    if (publiclyAvailable) {
      if (sponsorInstitution.logo) {
        return <Avatar imageUrl={sponsorInstitution.logo.secure_url} size={sizeToPx[size]} />
      }
      return null;
    }
    if (originalSponsorInstitution) {
      if (originalSponsorInstitution.logo) {
        return <Avatar imageUrl={originalSponsorInstitution.logo.secure_url} size={sizeToPx[size]} />
      }
      return null;
    }
    return <Avatar user={creator} size={sizeToPx[size]} />
  }

  return (
    <Stack direction="row" columnGap={1} mt={2} alignItems="center" justifyContent="flex-start">
      <CreatorAvatar />
      <Typography variant={sizeToTypographyVariant[size]}>
        {getCreatorText(activity, user)} el {moment(createdAt).format('DD [de] MMMM [de] YYYY')}
      </Typography>
    </Stack>
  )
}