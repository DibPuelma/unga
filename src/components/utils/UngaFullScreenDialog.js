import { forwardRef } from "react";
import { Box, Dialog, DialogTitle, IconButton, Slide } from "@mui/material";
import { Close } from "@mui/icons-material";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function UngaFullScreenDialog({ open, onClose, title, children }) {
  return (
    <Dialog
      fullScreen
      TransitionComponent={Transition}
      open={open}
      onClose={onClose}
    >
      {title && (<DialogTitle>{title}</DialogTitle>)}
      <Box px={2}>
        {children}
      </Box>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 5, top: 5 }}
        >
          <Close color="error" />
        </IconButton>
    </Dialog>
  )
}