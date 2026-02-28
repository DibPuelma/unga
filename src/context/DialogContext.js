import React, { useState, createContext } from 'react';

export const DialogContext = createContext();

export function DialogContextProvider({ children }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [confirm, setConfirm] = useState('Sí');
  const [cancel, setCancel] = useState('No');
  const [open, setOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState(() => {});

  const handleOnConfirmChange = (func) => {
    setOnConfirm(() => func);
  }

  const resetValues = () => {
    setTitle('');
    setDescription('');
    setConfirm('Sí');
    setCancel('No');
    setOpen(false);
    setOnConfirm(() => {});
  }

  return (
    <DialogContext.Provider value={{
      title,
      description,
      confirm,
      cancel,
      open,
      onConfirm,
      setTitle,
      setDescription,
      setConfirm,
      setCancel,
      setOpen,
      handleOnConfirmChange,
      resetValues,
    }}>
      {children}
    </DialogContext.Provider>
  )
}