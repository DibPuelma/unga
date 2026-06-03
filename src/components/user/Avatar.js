import { Avatar as MaterialAvatar } from '@mui/material';
import { stringToColor } from 'src/helpers/strings';

function stringAvatar(firstName, lastName) {
  return {
    sx: {
      bgcolor: stringToColor(firstName),
    },
    children: `${firstName[0].toUpperCase()}${lastName?.[0].toUpperCase()}`,
  };
}

export default function Avatar({ user, sx, size = 40, imageUrl }) {
  if (imageUrl) {
    return (
      <MaterialAvatar
        sx={{ width: size, height: size, ...sx }}
        alt="decorative image"
        src={imageUrl}
      />
    )
  }
  const profilePictureUrl = typeof user.profilePicture === 'string'
    ? user.profilePicture
    : user.profilePicture?.secure_url || user.profilePicture?.url;
  if (profilePictureUrl) {
    return (
      <MaterialAvatar
        sx={{ width: size, height: size, ...sx }}
        alt={`${user.firstName} ${user.lastName}`}
        src={profilePictureUrl}
      />
    )
  }
  return (
    <MaterialAvatar
      {...stringAvatar(user.firstName, user.lastName)}
      sx={{ width: size, height: size, fontSize: size * 0.5, ...sx }}
    />
  )
}