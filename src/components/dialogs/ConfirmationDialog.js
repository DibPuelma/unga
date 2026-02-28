import React, { useContext, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

import { DialogContext } from '../../context/DialogContext';
import { LoadingButton } from '@mui/lab';

export default function ConfirmationDialog() {
  const {
    title,
    description,
    confirm,
    cancel,
    onConfirm,
    handleOnConfirmChange,
    open,
    setOpen,
    resetValues,
  } = useContext(DialogContext);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    resetValues();
    setOpen(false);
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    resetValues();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">{cancel}</Button>
        <LoadingButton loading={loading} onClick={handleConfirm}>
          {confirm}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}