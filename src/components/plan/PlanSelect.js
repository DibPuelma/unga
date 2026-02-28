import { Stack } from "@mui/material"
import PlanCard from "./PlanCard"

const PLANS = [
  {
    id: 'individualStart',
    name: 'Inicia',
    monthlyPrice: '$6.900',
    icon: '/icons/plan-inicia.png',
    features: [
      'Accede a experiencias de aprendizaje creadas por expertas de Unga',
      'Crea experiencias de aprendizaje usando las bases curriculares',
      'Guarda todas tus experiencias en una biblioteca ordenada',
      'Accede a experiencias de aprendizaje creadas por otras educadoras de la comunidad',
    ],
    link: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=2c938084881f179b01882111b46b00e7',
  },
  {
    id: 'individualGrow',
    name: 'Crece',
    monthlyPrice: '$8.200',
    icon: '/icons/plan-crece.png',
    features: [
      'Accede a experiencias de aprendizaje creadas por expertas de Unga',
      'Crea experiencias de aprendizaje usando las bases curriculares',
      'Guarda todas tus experiencias en una biblioteca ordenada',
      'Accede a experiencias de aprendizaje creadas por otras educadoras de la comunidad',
      'Planifica e imprime tu calendario semanal',
      'Evalúa constantemente para seguir del progreso de la sala y el estudiante.',
      'Registra observaciones con fotos y videos para evidenciar el aprendizaje',
      'Descarga tus informes de evaluación con un par de clicks',
    ],
    link: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=2c938084881f171f0188214f220d012a',
  },
  {
    id: 'individualStandOut',
    name: 'Destaca',
    monthlyPrice: '$9.900',
    icon: '/icons/plan-destaca.png',
    features: [
      'Accede a experiencias de aprendizaje creadas por expertas de Unga',
      'Crea experiencias de aprendizaje usando las bases curriculares',
      'Guarda todas tus experiencias en una biblioteca ordenada',
      'Accede a experiencias de aprendizaje creadas por otras educadoras de la comunidad',
      'Planifica e imprime tu calendario semanal',
      'Evalúa constantemente para seguir del progreso de la sala y el estudiante.',
      'Registra observaciones con fotos y videos para evidenciar el aprendizaje',
      'Descarga tus informes de evaluación con un par de clicks',
      'Recibe sugerencias semanales de planificación basadas en el progreso de tu sala',
      'Crea experiencias de aprendizaje con apoyo de inteligencia artificial',
      'Registra y revisa la asistencia de tu sala',
    ],
    link: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=2c9380848820e6c00188214ff79a0042',
  },
]

export default function PlanSelect() {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} pb={4}>
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </Stack>
  )
}