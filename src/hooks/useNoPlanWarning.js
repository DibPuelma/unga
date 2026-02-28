import { useRouter } from "next/router";
import { useContext } from "react";
import { DialogContext } from "src/context/DialogContext";

export default function useNoPlanWarning({
  title,
  description,
}) {
  const router = useRouter();
  const {
    setTitle,
    setDescription,
    setConfirm,
    setCancel,
    setOpen,
    handleOnConfirmChange,
  } = useContext(DialogContext);

  const handleOpenNoPlanWarning = () => {
    setTitle(title);
    setDescription(description);
    setConfirm('Comenzar mi prueba gratuita');
    setCancel('No todavía');
    setOpen(true);
    handleOnConfirmChange(() => router.push('/users/onboarding'));
  };

  return handleOpenNoPlanWarning;
}