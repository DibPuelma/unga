import { useContext } from "react";
import Joyride from "react-joyride";
import { UserContext } from "src/context/UserContext";

export default function ReferralsTour(props) {
  const { user: { finishedReferralsTour } } = useContext(UserContext);
  if (finishedReferralsTour || props.hide) return null;

  return (
    <Joyride
      disableOverlayClose
      disableCloseOnEsc
      hideCloseButton
      continuous
      styles={{ options: { zIndex: 1202 } }}
      {...props}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
        ...props.locale,
      }}
    />
  );
}