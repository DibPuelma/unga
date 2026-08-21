import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SUBSCRIPTION_PRICE_CLP, MONTHLY_CREDITS, SIGNUP_CREDITS, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_CLP } from 'src/helpers/plans';

const formatCLP = (n) => `$${n.toLocaleString('es-CL')}`;

const FAQS = [
  {
    q: '¿Necesito tarjeta para probar Unga?',
    a: `No. Al crear tu cuenta recibes ${SIGNUP_CREDITS} creaciones con IA de regalo, sin registrar ningún medio de pago. Solo necesitas tarjeta si decides suscribirte.`,
  },
  {
    q: '¿Qué son los créditos?',
    a: `Cada experiencia que creas con IA usa 1 crédito. La suscripción de ${formatCLP(SUBSCRIPTION_PRICE_CLP)}/mes incluye ${MONTHLY_CREDITS} créditos que se renuevan el 1° de cada mes. Si necesitas más, puedes comprar packs de ${CREDIT_PACK_SIZE} créditos extra por ${formatCLP(CREDIT_PACK_PRICE_CLP)}; los créditos extra no vencen.`,
  },
  {
    q: '¿Sirve para mi nivel?',
    a: 'Sí. Unga cubre todos los tramos de la educación parvularia: Sala Cuna (0-2 años), Nivel Medio (2-4 años) y Nivel Transición (4-6 años).',
  },
  {
    q: '¿Las experiencias siguen las Bases Curriculares?',
    a: 'Sí. Cada experiencia se crea considerando los ámbitos, núcleos y Objetivos de Aprendizaje oficiales de las Bases Curriculares de la Educación Parvularia (Mineduc, 2018), e indica explícitamente qué OA aborda y cómo.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Puedes cancelar tu suscripción directamente desde la plataforma y mantienes el acceso hasta el final del período que ya pagaste.',
  },
  {
    q: '¿Cómo se cobra la suscripción?',
    a: `La suscripción se cobra el 1° de cada mes a tu tarjeta vía Transbank. Si te suscribes a mitad de mes, el primer cobro es proporcional a los días que quedan del mes.`,
  },
];

export default function FAQ() {
  return (
    <Box id="faq" sx={{ bgcolor: '#f7f9fb', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h2" align="center" sx={{ fontWeight: 700, color: '#575757', mb: 6, fontSize: { xs: 28, md: 36 } }}>
          Preguntas frecuentes
        </Typography>
        {FAQS.map((faq) => (
          <Accordion key={faq.q} disableGutters sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#575757' }}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
}
