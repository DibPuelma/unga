import { useContext } from "react";
import Joyride from "react-joyride";
import { UserContext } from "src/context/UserContext";

export default function UngaJoyride(props) {
  const { user: { plan, finishedTour } } = useContext(UserContext);
  if (plan === 'institutional' || finishedTour || props.hide) return null;

  return (
    <Joyride
      disableOverlayClose
      disableCloseOnEsc
      hideCloseButton
      continuous
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