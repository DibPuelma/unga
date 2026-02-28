import { Check, ShareOutlined } from "@mui/icons-material";
import { ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material";
import axios from "axios";
import { useContext } from "react"
import { DialogContext } from "src/context/DialogContext"

export default function ShareActivityToCommunityButton({ activity, onShare }) {
  const { setTitle, setDescription, setOpen, handleOnConfirmChange } = useContext(DialogContext);

  const handleConfirmShare = () => {
    setTitle('¿Quieres compartir esta experiencia?')
    setDescription('Al compartir esta experiencia ayudarás a otras educadoras, ya que la podrán usar en sus propias planificaciones')
    setOpen(true);
    handleOnConfirmChange(handleShare)
  }

  const handleShare = async () => {
    await axios.patch(`/api/activities/${activity.id}/share`)
    onShare();
    setOpen(false);
  }

  return (
    <MenuItem onClick={handleConfirmShare} disabled={!!activity.openToCommunity}>
      <ListItemIcon>
        {activity.openToCommunity ? <Check color="success" fontSize="small" /> : <ShareOutlined color="success" fontSize="small" />}
      </ListItemIcon>
      <Typography color="green">{activity.openToCommunity ? 'Compartida' : 'Compartir'}</Typography>
    </MenuItem>
  )
}