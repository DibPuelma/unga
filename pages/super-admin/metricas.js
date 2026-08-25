import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { DataGrid, esES } from '@mui/x-data-grid';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import {
  getApprovedPaymentsDetail,
  getBusinessMetrics,
  getRegistrationsDetail,
  getSubscriptionsDetail,
} from 'db/businessMetrics';
import moment from 'moment-timezone';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { isAuthorized } from 'services/Authorization';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const TIMEZONE = 'America/Santiago';
const SUBSCRIBED_STATUSES = ['active', 'payment_failed'];

// Paleta categórica validada para superficie clara (CVD ΔE 73.6). El aqua queda
// bajo 3:1 de contraste: siempre acompañado de leyenda y tabla de drill-down.
const SERIES = { blue: '#2a78d6', aqua: '#1baf7a', yellow: '#eda100' };
const INK = { secondary: '#52514e', muted: '#898781', grid: '#ebeae5' };
const CARD_BORDER = 'rgba(0,0,0,0.08)';

const PERIODS = {
  'mes-actual': { label: 'Mes actual' },
  'mes-anterior': { label: 'Mes anterior' },
  '30-dias': { label: 'Últimos 30 días' },
};

const STATUS_LABELS = {
  active: 'Activa',
  payment_failed: 'Pago fallido',
  cancelled: 'Cancelada',
};
const STATUS_COLORS = {
  active: 'success',
  payment_failed: 'warning',
  cancelled: 'default',
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
  const [current, previous, subscriptions, registrations, payments] = await Promise.all([
    getBusinessMetrics(ranges.current),
    getBusinessMetrics(ranges.previous),
    getSubscriptionsDetail({ from: ranges.current.from }),
    getRegistrationsDetail(ranges.current),
    getApprovedPaymentsDetail(ranges.current),
  ]);

  // Último día con datos posibles: hoy para períodos abiertos, el cierre para cerrados.
  const chartTo = new Date(Math.min(moment.tz(TIMEZONE).valueOf(), ranges.current.to.getTime() - 1));

  return {
    props: {
      period,
      range: { from: ranges.current.from.toISOString(), chartTo: chartTo.toISOString() },
      current,
      previous,
      subscriptions,
      registrations,
      payments,
    },
  };
}

const formatCLP = (n) => `$${n.toLocaleString('es-CL')}`;
const formatDay = (iso) => (iso ? moment.tz(iso, TIMEZONE).format('YYYY-MM-DD') : '—');

const buildDays = (fromIso, toIso) => {
  const days = [];
  const cursor = moment.tz(fromIso, TIMEZONE).startOf('day');
  const end = moment.tz(toIso, TIMEZONE);
  while (cursor.isSameOrBefore(end, 'day')) {
    days.push(cursor.format('YYYY-MM-DD'));
    cursor.add(1, 'day');
  }
  return days;
};

const bucketByDay = (days, rows, dateKey, valueOf = () => 1) => {
  const byDay = Object.fromEntries(days.map((day) => [day, 0]));
  rows.forEach((row) => {
    const day = moment.tz(row[dateKey], TIMEZONE).format('YYYY-MM-DD');
    if (day in byDay) byDay[day] += valueOf(row);
  });
  return days.map((day) => byDay[day]);
};

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        color: INK.secondary,
        font: { family: 'Poppins', size: 12 },
      },
    },
    datalabels: { display: false },
  },
};
const xScale = {
  grid: { display: false },
  ticks: { color: INK.muted, maxTicksLimit: 8, maxRotation: 0, font: { family: 'Poppins', size: 11 } },
};
const countChartOptions = {
  ...baseChartOptions,
  scales: {
    x: xScale,
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: INK.muted, font: { family: 'Poppins', size: 11 } },
      grid: { color: INK.grid, drawBorder: false },
    },
  },
};
const moneyChartOptions = {
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      callbacks: {
        label: (context) => `${context.dataset.label}: ${formatCLP(context.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { ...xScale, stacked: true },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        color: INK.muted,
        font: { family: 'Poppins', size: 11 },
        callback: (value) => formatCLP(value),
      },
      grid: { color: INK.grid, drawBorder: false },
    },
  },
};

function DeltaChip({ value, previousValue, invert = false }) {
  const delta = value - previousValue;
  const isGood = invert ? delta < 0 : delta > 0;
  const color = delta === 0 ? INK.muted : isGood ? '#006300' : '#b3261e';
  const backgroundColor = delta === 0
    ? 'rgba(0,0,0,0.05)'
    : isGood ? 'rgba(0,99,0,0.08)' : 'rgba(179,38,30,0.08)';
  return (
    <Box
      component="span"
      title={`Período anterior: ${previousValue}`}
      sx={{ px: 0.75, py: 0.25, borderRadius: 1, fontSize: 12, fontWeight: 600, color, backgroundColor, whiteSpace: 'nowrap' }}
    >
      {delta === 0 ? '=' : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`}
    </Box>
  );
}

function StatCard({ title, value, caption, previousValue, invertDelta, onClick, size = 'medium', children }) {
  const clickable = Boolean(onClick);
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper
        variant="outlined"
        onClick={onClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (event) => event.key === 'Enter' && onClick() : undefined}
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          borderColor: CARD_BORDER,
          ...(clickable && {
            cursor: 'pointer',
            transition: 'box-shadow .15s ease, border-color .15s ease',
            '&:hover, &:focus-visible': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
              borderColor: 'primary.main',
            },
          }),
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary" noWrap title={title}>{title}</Typography>
          {clickable && <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography
            variant={size === 'large' ? 'h3' : 'h4'}
            sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </Typography>
          {previousValue !== undefined && (
            <DeltaChip value={Number(value) || 0} previousValue={previousValue} invert={invertDelta} />
          )}
        </Stack>
        {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
        {children}
      </Paper>
    </Grid>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <Box mb={2}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Grid item xs={12} md={6}>
      <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderColor: CARD_BORDER }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        <Box sx={{ height: 260, mt: 2 }}>{children}</Box>
      </Paper>
    </Grid>
  );
}

function SeatsBreakdown({ seats }) {
  const items = [
    { label: 'directoras', value: seats.principal || 0, color: SERIES.blue },
    { label: 'coordinadoras', value: seats.coordinator || 0, color: SERIES.aqua },
    { label: 'docentes', value: seats.teacher || 0, color: SERIES.yellow },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return null;
  return (
    <Stack spacing={1} mt={0.5}>
      <Box sx={{ display: 'flex', gap: '2px', height: 8, borderRadius: 4, overflow: 'hidden' }}>
        {items.filter((item) => item.value > 0).map((item) => (
          <Box key={item.label} sx={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }} />
        ))}
      </Box>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {items.map((item) => (
          <Stack key={item.label} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
            <Typography variant="caption" color="text.secondary">{item.value} {item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

const renderStatusChip = ({ value }) => (value ? (
  <Chip size="small" variant="outlined" label={STATUS_LABELS[value] || value} color={STATUS_COLORS[value] || 'default'} />
) : '—');

const SUBSCRIPTION_COLUMNS = [
  { field: 'userName', headerName: 'Nombre', flex: 1.6, minWidth: 160 },
  { field: 'userEmail', headerName: 'Email', flex: 2, minWidth: 200 },
  { field: 'userCreatedAt', headerName: 'Fecha registro', flex: 1, minWidth: 120 },
  { field: 'createdAt', headerName: 'Fecha suscripción', flex: 1, minWidth: 130 },
  { field: 'amount', headerName: 'Monto', flex: 0.8, minWidth: 90 },
  { field: 'status', headerName: 'Estado', flex: 1, minWidth: 120, renderCell: renderStatusChip },
  { field: 'cancelAtPeriodEnd', headerName: 'Cancela al cierre', flex: 0.9, minWidth: 120 },
  { field: 'currentPeriodEnd', headerName: 'Fin período', flex: 1, minWidth: 110 },
  { field: 'cancelledAt', headerName: 'Cancelada el', flex: 1, minWidth: 110 },
];

const REGISTRATION_COLUMNS = [
  { field: 'name', headerName: 'Nombre', flex: 1.6, minWidth: 160 },
  { field: 'email', headerName: 'Email', flex: 2, minWidth: 200 },
  { field: 'createdAt', headerName: 'Fecha registro', flex: 1, minWidth: 120 },
  { field: 'plan', headerName: 'Plan', flex: 0.8, minWidth: 90 },
  { field: 'paymentStartedAt', headerName: 'Inició pago', flex: 1, minWidth: 110 },
  { field: 'subscriptionStatus', headerName: 'Suscripción', flex: 1, minWidth: 120, renderCell: renderStatusChip },
  { field: 'subscriptionCreatedAt', headerName: 'Fecha suscripción', flex: 1, minWidth: 130 },
  { field: 'subscriptionCancelledAt', headerName: 'Cancelada el', flex: 1, minWidth: 110 },
  { field: 'reference', headerName: 'Referencia', flex: 1, minWidth: 110 },
];

const toSubscriptionRow = (subscription) => ({
  id: subscription.id,
  userName: subscription.userName || '—',
  userEmail: subscription.userEmail || '—',
  userCreatedAt: formatDay(subscription.userCreatedAt),
  createdAt: formatDay(subscription.createdAt),
  amount: formatCLP(subscription.amount),
  status: subscription.status,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ? 'Sí' : '—',
  currentPeriodEnd: formatDay(subscription.currentPeriodEnd),
  cancelledAt: formatDay(subscription.cancelledAt),
});

const toRegistrationRow = (user) => ({
  id: user.id,
  name: user.name || '—',
  email: user.email || '—',
  createdAt: formatDay(user.createdAt),
  plan: user.plan,
  paymentStartedAt: formatDay(user.paymentStartedAt),
  subscriptionStatus: user.subscriptionStatus,
  subscriptionCreatedAt: formatDay(user.subscriptionCreatedAt),
  subscriptionCancelledAt: formatDay(user.subscriptionCancelledAt),
  reference: user.reference || '—',
});

function DrilldownDialog({ drilldown, onClose }) {
  return (
    <Dialog open={Boolean(drilldown)} onClose={onClose} fullWidth maxWidth="lg">
      {drilldown && (
        <>
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                {drilldown.title} ({drilldown.rows.length})
                <Typography variant="body2" color="text.secondary">{drilldown.subtitle}</Typography>
              </Box>
              <IconButton onClick={onClose} size="small" aria-label="Cerrar">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <DataGrid
              autoHeight
              density="compact"
              rows={drilldown.rows}
              columns={drilldown.columns}
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              disableSelectionOnClick
              localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

export default function Metricas({ period, range, current, previous, subscriptions, registrations, payments }) {
  const router = useRouter();
  const [drilldownKey, setDrilldownKey] = useState(null);
  const { b2c, b2b } = current;

  const conversionRate = b2c.newB2CUsers
    ? Math.round((b2c.newB2CUsersConverted / b2c.newB2CUsers) * 100)
    : 0;
  const seats = b2b.seatsByRole;
  const totalSeats = Object.values(seats).reduce((sum, count) => sum + count, 0);
  const totalRevenue = b2c.subscriptionRevenue + b2c.creditPackRevenue;
  const mrrAtRisk = b2c.cancelAtPeriodEndCount
    * (b2c.activeSubscribers ? Math.round(b2c.mrr / b2c.activeSubscribers) : 0);

  const subsets = useMemo(() => {
    // Comparación lexicográfica de ISO strings: mismo formato, mismo orden temporal.
    const inPeriod = (iso) => iso && iso >= range.from && iso <= range.chartTo;
    const active = subscriptions.filter((s) => SUBSCRIBED_STATUSES.includes(s.status));
    const cancelledInPeriod = subscriptions.filter((s) => s.status === 'cancelled' && inPeriod(s.cancelledAt));
    return {
      active,
      atRisk: active.filter((s) => s.status === 'payment_failed'),
      cancelAtPeriodEnd: active.filter((s) => s.cancelAtPeriodEnd),
      created: subscriptions.filter((s) => inPeriod(s.createdAt)),
      voluntaryChurn: cancelledInPeriod.filter((s) => s.cancelAtPeriodEnd),
      involuntaryChurn: cancelledInPeriod.filter((s) => !s.cancelAtPeriodEnd),
    };
  }, [subscriptions, range]);

  const charts = useMemo(() => {
    const days = buildDays(range.from, range.chartTo);
    const labels = days.map((day) => moment.tz(day, TIMEZONE).format('D MMM'));
    // Con un solo día de datos una línea sin puntos es invisible.
    const lineSeries = { borderWidth: 2, pointRadius: days.length > 1 ? 0 : 4, pointHoverRadius: 4, tension: 0.3 };
    const barSeries = { borderColor: '#fff', borderWidth: 1, borderRadius: 2, maxBarThickness: 24 };
    return {
      acquisition: {
        labels,
        datasets: [
          {
            label: 'Registros B2C',
            data: bucketByDay(days, registrations, 'createdAt'),
            borderColor: SERIES.blue,
            backgroundColor: SERIES.blue,
            ...lineSeries,
          },
          {
            label: 'Nuevas suscripciones',
            data: bucketByDay(days, subsets.created, 'createdAt'),
            borderColor: SERIES.aqua,
            backgroundColor: SERIES.aqua,
            ...lineSeries,
          },
        ],
      },
      revenue: {
        labels,
        datasets: [
          {
            label: 'Suscripciones',
            data: bucketByDay(
              days,
              payments.filter((p) => p.type !== 'credit_pack'),
              'createdAt',
              (p) => p.amount,
            ),
            backgroundColor: SERIES.blue,
            ...barSeries,
          },
          {
            label: 'Packs de créditos',
            data: bucketByDay(
              days,
              payments.filter((p) => p.type === 'credit_pack'),
              'createdAt',
              (p) => p.amount,
            ),
            backgroundColor: SERIES.aqua,
            ...barSeries,
          },
        ],
      },
    };
  }, [registrations, subsets.created, payments, range]);

  const drilldowns = {
    activos: {
      title: 'Suscriptores activos',
      subtitle: 'Suscripciones activas o en gracia de pago',
      rows: subsets.active.map(toSubscriptionRow),
      columns: SUBSCRIPTION_COLUMNS,
    },
    riesgo: {
      title: 'En riesgo de pago',
      subtitle: 'Suscripciones con pago fallido, en reintentos',
      rows: subsets.atRisk.map(toSubscriptionRow),
      columns: SUBSCRIPTION_COLUMNS,
    },
    cancelaran: {
      title: 'Cancelarán a fin de período',
      subtitle: 'Suscripciones vigentes con cancelación programada',
      rows: subsets.cancelAtPeriodEnd.map(toSubscriptionRow),
      columns: SUBSCRIPTION_COLUMNS,
    },
    nuevas: {
      title: 'Nuevas suscripciones',
      subtitle: 'Suscripciones creadas en el período',
      rows: subsets.created.map(toSubscriptionRow),
      columns: SUBSCRIPTION_COLUMNS,
    },
    churnVoluntario: {
      title: 'Churn voluntario',
      subtitle: 'Cancelaron por decisión propia durante el período',
      rows: subsets.voluntaryChurn.map(toSubscriptionRow),
      columns: SUBSCRIPTION_COLUMNS,
    },
    churnInvoluntario: {
      title: 'Churn involuntario',
      subtitle: 'Cancelados por fallos de pago durante el período',
      rows: subsets.involuntaryChurn.map(toSubscriptionRow),
      columns: SUBSCRIPTION_COLUMNS,
    },
    registros: {
      title: 'Nuevos registros B2C',
      subtitle: 'Usuarios registrados en el período, con su última suscripción',
      rows: registrations.map(toRegistrationRow),
      columns: REGISTRATION_COLUMNS,
    },
  };

  const rangeLabel = `${moment.tz(range.from, TIMEZONE).format('D MMM')} — ${moment.tz(range.chartTo, TIMEZONE).format('D MMM YYYY')}`;

  return (
    <Stack spacing={4} pb={4}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Métricas de negocio</Typography>
          <Typography variant="body2" color="text.secondary">
            {rangeLabel} · comparado con el período anterior
          </Typography>
        </Box>
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

      <Grid container spacing={2}>
        <StatCard
          size="large"
          title="MRR"
          value={formatCLP(b2c.mrr)}
          caption="Suscripciones activas + en gracia de pago"
        />
        <StatCard
          size="large"
          title="Suscriptores activos"
          value={b2c.activeSubscribers}
          caption={`${b2c.paymentFailedCount} en gracia de pago`}
          onClick={() => setDrilldownKey('activos')}
        />
        <StatCard
          size="large"
          title="Ingresos del período"
          value={formatCLP(totalRevenue)}
          caption={`${formatCLP(b2c.subscriptionRevenue)} suscripciones · ${formatCLP(b2c.creditPackRevenue)} packs`}
        />
        <StatCard
          size="large"
          title="Conversión registro→pago"
          value={`${conversionRate}%`}
          caption={`${b2c.newB2CUsersConverted} de ${b2c.newB2CUsers} registros — cohortes recientes aún no maduran`}
        />
      </Grid>

      <Box>
        <SectionTitle title="Tendencias del período" subtitle="Actividad diaria del negocio B2C" />
        <Grid container spacing={2}>
          <ChartCard title="Adquisición" subtitle="Registros B2C y nuevas suscripciones por día">
            <Line data={charts.acquisition} options={countChartOptions} />
          </ChartCard>
          <ChartCard title="Ingresos" subtitle="Pagos aprobados por día: suscripciones y packs">
            <Bar data={charts.revenue} options={moneyChartOptions} />
          </ChartCard>
        </Grid>
      </Box>

      <Box>
        <SectionTitle title="B2C — Adquisición y actividad" />
        <Grid container spacing={2}>
          <StatCard
            title="Nuevos registros B2C"
            value={b2c.newB2CUsers}
            previousValue={previous.b2c.newB2CUsers}
            caption={`Período anterior: ${previous.b2c.newB2CUsers}`}
            onClick={() => setDrilldownKey('registros')}
          />
          <StatCard
            title="Nuevas suscripciones"
            value={b2c.newSubscriptions}
            previousValue={previous.b2c.newSubscriptions}
            caption={`Período anterior: ${previous.b2c.newSubscriptions}`}
            onClick={() => setDrilldownKey('nuevas')}
          />
          <StatCard
            title="Usuarios B2C activos"
            value={b2c.activeB2CUsers}
            previousValue={previous.b2c.activeB2CUsers}
            caption="Consumieron créditos en el período"
          />
          <StatCard
            title="Packs de créditos"
            value={b2c.creditPacksSold}
            caption={`${formatCLP(b2c.creditPackRevenue)} · ${b2c.creditsGranted} créditos otorgados`}
          />
        </Grid>
      </Box>

      <Box>
        <SectionTitle title="B2C — Retención y riesgo" />
        <Grid container spacing={2}>
          <StatCard
            title="En riesgo de pago"
            value={b2c.paymentFailedCount}
            caption="Con pago fallido, en reintentos"
            onClick={() => setDrilldownKey('riesgo')}
          />
          <StatCard
            title="Cancelarán a fin de período"
            value={b2c.cancelAtPeriodEndCount}
            caption={`MRR en riesgo: ${formatCLP(mrrAtRisk)}`}
            onClick={() => setDrilldownKey('cancelaran')}
          />
          <StatCard
            title="Churn voluntario"
            value={b2c.voluntaryChurn}
            previousValue={previous.b2c.voluntaryChurn}
            invertDelta
            caption={`Período anterior: ${previous.b2c.voluntaryChurn}`}
            onClick={() => setDrilldownKey('churnVoluntario')}
          />
          <StatCard
            title="Churn involuntario"
            value={b2c.involuntaryChurn}
            previousValue={previous.b2c.involuntaryChurn}
            invertDelta
            caption="Por fallos de pago"
            onClick={() => setDrilldownKey('churnInvoluntario')}
          />
          <StatCard
            title="Pagos rechazados"
            value={b2c.rejectedPayments}
            previousValue={previous.b2c.rejectedPayments}
            invertDelta
            caption={`Período anterior: ${previous.b2c.rejectedPayments}`}
          />
        </Grid>
      </Box>

      <Box>
        <SectionTitle title="B2B — Instituciones" />
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
            title="Docentes activos"
            value={b2b.activeTeachers}
            previousValue={previous.b2b.activeTeachers}
            caption="Con observaciones en el período"
          />
          <StatCard title="Asientos" value={totalSeats}>
            <SeatsBreakdown seats={seats} />
          </StatCard>
          <StatCard
            title="Observaciones"
            value={b2b.observations}
            previousValue={previous.b2b.observations}
            caption={`Período anterior: ${previous.b2b.observations}`}
          />
          <StatCard
            title="Evaluaciones"
            value={b2b.evaluations}
            previousValue={previous.b2b.evaluations}
            caption={`Período anterior: ${previous.b2b.evaluations}`}
          />
          <StatCard
            title="Planificaciones"
            value={b2b.plannedActivities}
            previousValue={previous.b2b.plannedActivities}
            caption={`Período anterior: ${previous.b2b.plannedActivities}`}
          />
        </Grid>
      </Box>

      <DrilldownDialog drilldown={drilldownKey && drilldowns[drilldownKey]} onClose={() => setDrilldownKey(null)} />
    </Stack>
  );
}
