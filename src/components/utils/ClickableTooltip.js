import { InfoOutlined } from "@mui/icons-material";
import { ClickAwayListener, IconButton, Tooltip } from "@mui/material";
import { useState } from "react";

export default function ClickableTooltip({
  title,
  icon = <InfoOutlined />,
  color = 'info',
  sx,
}) {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div>
        <Tooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableTouchListener
          title={title}
        >
          <IconButton
            color={color}
            sx={sx}
            onClick={handleTooltipOpen}>
            {icon}
          </IconButton>
        </Tooltip>
      </div>
    </ClickAwayListener>
  );
}