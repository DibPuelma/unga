import { useState } from "react"
import UngaFullScreenDialog from "../utils/UngaFullScreenDialog";
import { Button, Container, Dialog, Stack, useMediaQuery } from "@mui/material";
import UngaRatioImage from "../utils/UngaRatioImage";
import { Circle } from "@mui/icons-material";

const MAX_STEPS = 6;

export default function OnboardingDialog({ open: propsOpen }) {
  const [open, setOpen] = useState(propsOpen);
  const [step, setStep] = useState(0);
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const handleNextStep = () => {
    setStep((oldValue) => oldValue + 1);
  }

  return (
    <Dialog
      maxWidth="xs"
      fullScreen={!smUp}
      open={open}
    >
      <Stack p={2} spacing={2} alignItems="center" justifyContent="center" height="100%">
        <UngaRatioImage
          image={{
            width: 1080,
            height: 1920,
            secure_url: `/screenShots/${step + 1}.jpg`,
          }}
          priority
          baseHeight={600}
          borderRadius={2}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          {Array.from(Array(MAX_STEPS).keys()).map((index) => (
            <Circle onClick={() => setStep(index)} color={index === step ? "primary" : "disabled"} key={index} />
          ))}
        </Stack>
        <Stack spacing={1} width="100%">
          {step < 5 ? (
            <Button fullWidth variant="contained" onClick={handleNextStep}>Siguiente</Button>
          ) : (

            <Button fullWidth variant="contained" onClick={() => setOpen(false)}>Finalizar</Button>
          )}
          <Button fullWidth color="secondary" onClick={() => setOpen(false)}>Omitir</Button>
        </Stack>
      </Stack>
    </Dialog>
  )
}