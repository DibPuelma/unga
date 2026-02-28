import { useRouter } from "next/router";
import { useContext } from "react";
import { DialogContext } from "src/context/DialogContext";
import { UserContext } from "src/context/UserContext";

export default function usePlanUpgradeWarning({
  title = 'Necesitas mejorar tu plan para acceder a esta funcionalidad',
  description,
} = {}) {
  const { user: { id } } = useContext(UserContext);
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
    setConfirm('Ver planes');
    setCancel('No todavía');
    setOpen(true);
    handleOnConfirmChange(() => router.push(`/users/${id}/current-plan`));
  };

  return handleOpenNoPlanWarning;
}