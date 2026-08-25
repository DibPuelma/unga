import { Grid, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import { getBusinessMetrics } from 'db/businessMetrics';
import moment from 'moment-timezone';
import { useRouter } from 'next/router';
import { isAuthorized } from 'services/Authorization';

const TIMEZONE = 'America/Santiago';

const PERIODS = {
  'mes-actual': { label: 'Mes actual' },
  'mes-anterior': { label: 'Mes anterior' },
  '30-dias': { label: 'Últimos 30 días' },
};

const getPeriodRanges = (period) => {
  const now = moment.tz(TIMEZONE);
  if (period === 'mes-anterior') {
    const start = now.clone().subtract(1, 'month').startOf('month');
    return {
      current: { from: start.toDate(), to: start.clone().add(1, 'month').toDate() },
      previous: {
        from: start.clone().subtract(1, 'month').toDate(),
        to: start.toDate(),
      },
    };
  }
  if (period === '30-dias') {
    return {
      current: { from: now.clone().subtract(30, 'days').toDate(), to: now.toDate() },
      previous: {
        from: now.clone().subtract(60, 'days').toDate(),
        to: now.clone().subtract(30, 'days').toDate(),
      },
    };
  }
  const start = now.clone().startOf('month');
  return {
    current: { from: start.toDate(), to: start.clone().add(1, 'month').toDate() },
    previous: { from: start.clone().subtract(1, 'month').toDate(), to: start.toDate() },
  };
};

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const period = PERIODS[context.query.period] ? context.query.period : 'mes-actual';
  const ranges = getPeriodRanges(period);
  const [current, previous] = await Promise.all([
    getBusinessMetrics(ranges.current),
    getBusinessMetrics(ranges.previous),
  ]);

  return {
    props: {
      period,
      current,
      previous,
    },
  };
}

const formatCLP = (n) => `$${n.toLocaleString('es-CL')}`;

const formatDelta = (value, previousValue) => {
  const delta = value - previousValue;
  if (delta === 0) return `= período anterior (${previousValue})`;
  return `${delta > 0 ? '+' : ''}${delta} vs período anterior (${previousValue})`;
};

function StatCard({ title, value, caption }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h4">{value}</Typography>
        <Typography>{title}</Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">{caption}</Typography>
        )}
      </Paper>
    </Grid>
  );
}

export default function Metricas({ period, current, previous }) {
  const router = useRouter();
  const { b2c, b2b } = current;

  const conversionRate = b2c.newB2CUsers
    ? Math.round((b2c.newB2CUsersConverted / b2c.newB2CUsers) * 100)
    : 0;
  const seats = b2b.seatsByRole;
  const totalSeats = Object.values(seats).reduce((sum, count) => sum + count, 0);

  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Métricas de negocio</Typography>
        <Select
          size="small"
          value={period}
          onChange={(event) => router.push({ query: { period: event.target.value } })}
        >
          {Object.entries(PERIODS).map(([value, { label }]) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>
      </Stack>

      <Typography variant="h5" sx={{ mb: 1 }}>B2C — Suscripciones</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <StatCard
          title="MRR"
          value={formatCLP(b2c.mrr)}
          caption="Suscripciones activas + en gracia de pago"
        />
        <StatCard title="Suscriptores activos" value={b2c.activeSubscribers} />
        <StatCard
          title="En riesgo de pago"
          value={b2c.paymentFailedCount}
          caption="Con pago fallido, en reintentos"
        />
        <StatCard
          title="Cancelarán a fin de período"
          value={b2c.cancelAtPeriodEndCount}
          caption={`MRR en riesgo: ${formatCLP(b2c.cancelAtPeriodEndCount * (b2c.activeSubscribers ? Math.round(b2c.mrr / b2c.activeSubscribers) : 0))}`}
        />
        <StatCard
          title="Nuevos registros B2C"
          value={b2c.newB2CUsers}
          caption={formatDelta(b2c.newB2CUsers, previous.b2c.newB2CUsers)}
        />
        <StatCard
          title="Nuevas suscripciones"
          value={b2c.newSubscriptions}
          caption={formatDelta(b2c.newSubscriptions, previous.b2c.newSubscriptions)}
        />
        <StatCard
          title="Conversión registro→pago"
          value={`${conversionRate}%`}
          caption={`${b2c.newB2CUsersConverted} / ${b2c.newB2CUsers} del período — cohortes recientes aún no maduran`}
        />
        <StatCard
          title="Usuarios B2C activos"
          value={b2c.activeB2CUsers}
          caption={`Consumieron créditos en el período — ${formatDelta(b2c.activeB2CUsers, previous.b2c.activeB2CUsers)}`}
        />
        <StatCard
          title="Churn voluntario"
          value={b2c.voluntaryChurn}
          caption={formatDelta(b2c.voluntaryChurn, previous.b2c.voluntaryChurn)}
        />
        <StatCard
          title="Churn involuntario"
          value={b2c.involuntaryChurn}
          caption={`Por fallos de pago — ${formatDelta(b2c.involuntaryChurn, previous.b2c.involuntaryChurn)}`}
        />
        <StatCard
          title="Ingresos suscripciones"
          value={formatCLP(b2c.subscriptionRevenue)}
          caption={`${b2c.subscriptionPaymentsCount} pagos aprobados en el período`}
        />
        <StatCard
          title="Ingresos packs de créditos"
          value={formatCLP(b2c.creditPackRevenue)}
          caption={`${b2c.creditPacksSold} packs, ${b2c.creditsGranted} créditos otorgados`}
        />
        <StatCard
          title="Pagos rechazados"
          value={b2c.rejectedPayments}
          caption={formatDelta(b2c.rejectedPayments, previous.b2c.rejectedPayments)}
        />
      </Grid>

      <Typography variant="h5" sx={{ mb: 1 }}>B2B — Instituciones</Typography>
      <Grid container spacing={2}>
        <StatCard
          title="Instituciones B2B"
          value={b2b.institutions}
          caption="Con al menos un usuario institucional"
        />
        <StatCard
          title="Instituciones activas"
          value={b2b.activeInstitutions}
          caption="Con observaciones en el período"
        />
        <StatCard
          title="Asientos"
          value={totalSeats}
          caption={`${seats.principal || 0} directoras, ${seats.coordinator || 0} coordinadoras, ${seats.teacher || 0} docentes`}
        />
        <StatCard
          title="Docentes activos"
          value={b2b.activeTeachers}
          caption={`Con observaciones en el período — ${formatDelta(b2b.activeTeachers, previous.b2b.activeTeachers)}`}
        />
        <StatCard
          title="Observaciones"
          value={b2b.observations}
          caption={formatDelta(b2b.observations, previous.b2b.observations)}
        />
        <StatCard
          title="Evaluaciones"
          value={b2b.evaluations}
          caption={formatDelta(b2b.evaluations, previous.b2b.evaluations)}
        />
        <StatCard
          title="Planificaciones"
          value={b2b.plannedActivities}
          caption={formatDelta(b2b.plannedActivities, previous.b2b.plannedActivities)}
        />
      </Grid>
    </Stack>
  );
}
