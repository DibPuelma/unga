import {
  AccountTree,
  Add,
  CancelOutlined,
  DeleteOutlined,
  EditOutlined,
  ExpandLess,
  ExpandMore,
  SaveOutlined,
  SearchOutlined,
  UnfoldLess,
  UnfoldMore,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useContext, useMemo, useState, useCallback } from "react";
import UngaCircularProgress from "src/components/utils/UngaCircularProgress";
import { DialogContext } from "src/context/DialogContext";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import useSWR from "swr";

const LEVEL_COLORS = [
  '#fb9f71',
  '#9fbfd5',
  '#7ec8a0',
  '#c4a6e0',
];

const LEVEL_BG = [
  'rgba(251,159,113,0.06)',
  'rgba(159,191,213,0.08)',
  'rgba(126,200,160,0.08)',
  'rgba(196,166,224,0.08)',
];

function highlightMatch(text, search) {
  if (!search) return text;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <Box component="span" sx={{ backgroundColor: 'rgba(251,159,113,0.35)', borderRadius: '2px', px: '2px' }}>
        {text.slice(idx, idx + search.length)}
      </Box>
      {text.slice(idx + search.length)}
    </>
  );
}

function InlineEditor({ value, onSave, onCancel, loading }) {
  const [text, setText] = useState(value);
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
      <TextField
        autoFocus
        fullWidth
        size="small"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(text);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <IconButton size="small" onClick={() => onSave(text)} disabled={loading || !text.trim()}>
        {loading ? <CircularProgress size={16} /> : <SaveOutlined color="primary" />}
      </IconButton>
      <IconButton size="small" onClick={onCancel} disabled={loading}>
        <CancelOutlined color="error" />
      </IconButton>
    </Stack>
  );
}

function InlineAddForm({ placeholder, onAdd, onCancel, loading }) {
  const [text, setText] = useState('');
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1, px: 2 }}>
      <TextField
        autoFocus
        fullWidth
        size="small"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) onAdd(text.trim());
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Button
        size="small"
        variant="contained"
        disabled={loading || !text.trim()}
        onClick={() => onAdd(text.trim())}
        startIcon={loading ? <CircularProgress size={14} /> : <Add />}
      >
        Crear
      </Button>
      <IconButton size="small" onClick={onCancel}>
        <CancelOutlined />
      </IconButton>
    </Stack>
  );
}

function SubObjectiveRow({ subObjective, objectiveId, institutionId, mutateTree, search }) {
  const { setTitle, setDescription, setOpen, handleOnConfirmChange } = useContext(DialogContext);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSave = async (name) => {
    setLoading(true);
    try {
      await axios.patch(
        `/api/institutions/${institutionId}/objectives/${objectiveId}/sub-objectives/${subObjective.id}`,
        { name }
      );
      await mutateTree();
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setTitle('¿Quieres eliminar este indicador de evaluación?');
    setDescription('Esta acción es irreversible. Las evaluaciones asociadas se perderán.');
    handleOnConfirmChange(async () => {
      setOpen(false);
      setLoading(true);
      try {
        await axios.delete(
          `/api/institutions/${institutionId}/objectives/${objectiveId}/sub-objectives/${subObjective.id}`
        );
        await mutateTree();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    });
    setOpen(true);
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          pl: { xs: 4, sm: 8 },
          pr: 1,
          py: 0.75,
          borderLeft: `3px solid ${LEVEL_COLORS[3]}`,
          ml: { xs: 2, sm: 6 },
          backgroundColor: LEVEL_BG[3],
          borderRadius: '0 6px 6px 0',
          mb: 0.5,
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: 'rgba(196,166,224,0.15)' },
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: LEVEL_COLORS[3], flexShrink: 0 }} />
        {editing ? (
          <InlineEditor
            value={subObjective.name}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            loading={loading}
          />
        ) : (
          <>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {highlightMatch(subObjective.name, search)}
            </Typography>
            <Stack direction="row" sx={{ flexShrink: 0 }}>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditOutlined fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton size="small" onClick={handleDelete} disabled={loading}>
                  {loading ? <CircularProgress size={14} /> : <DeleteOutlined fontSize="small" color="error" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </>
        )}
      </Stack>
      <Snackbar open={error} autoHideDuration={4000} onClose={() => setError(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(false)}>Error al procesar la solicitud</Alert>
      </Snackbar>
    </>
  );
}

function ObjectiveRow({ objective, institutionId, mutateTree, search }) {
  const { setTitle, setDescription, setOpen, handleOnConfirmChange } = useContext(DialogContext);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSave = async (name) => {
    setLoading(true);
    try {
      await axios.patch(`/api/institutions/${institutionId}/objectives/${objective.id}`, { name });
      await mutateTree();
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setTitle('¿Quieres eliminar este indicador de informe?');
    setDescription('Esta acción es irreversible. Se eliminarán también sus indicadores de evaluación y las evaluaciones asociadas.');
    handleOnConfirmChange(async () => {
      setOpen(false);
      setLoading(true);
      try {
        await axios.delete(`/api/institutions/${institutionId}/objectives/${objective.id}`);
        await mutateTree();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    });
    setOpen(true);
  };

  const handleAddSubObjective = async (name) => {
    setLoading(true);
    try {
      await axios.post(
        `/api/institutions/${institutionId}/objectives/${objective.id}/sub-objectives`,
        { name, institution: institutionId }
      );
      await mutateTree();
      setAdding(false);
      setExpanded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const subCount = objective.subObjectives?.length || 0;
  const matchesSearch = search && objective.name.toLowerCase().includes(search.toLowerCase());
  const childMatchesSearch = search && objective.subObjectives?.some(
    (so) => so.name.toLowerCase().includes(search.toLowerCase())
  );
  const shouldShow = !search || matchesSearch || childMatchesSearch;

  if (!shouldShow) return null;

  return (
    <>
      <Stack
        sx={{
          pl: { xs: 2, sm: 4 },
          pr: 1,
          ml: { xs: 1, sm: 3 },
          borderLeft: `3px solid ${LEVEL_COLORS[2]}`,
          backgroundColor: LEVEL_BG[2],
          borderRadius: '0 6px 6px 0',
          mb: 0.75,
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: 'rgba(126,200,160,0.15)' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.75 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded((v) => !v)}
            sx={{ visibility: subCount > 0 ? 'visible' : 'hidden' }}
          >
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>

          {editing ? (
            <InlineEditor
              value={objective.name}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              loading={loading}
            />
          ) : (
            <>
              <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                {highlightMatch(objective.name, search)}
              </Typography>
              {subCount > 0 && (
                <Chip label={subCount} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: LEVEL_COLORS[3], color: '#fff' }} />
              )}
              <Stack direction="row" sx={{ flexShrink: 0 }}>
                <Tooltip title="Agregar indicador de evaluación">
                  <IconButton size="small" onClick={() => { setAdding(true); setExpanded(true); }}>
                    <Add fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => setEditing(true)}>
                    <EditOutlined fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" onClick={handleDelete} disabled={loading}>
                    {loading ? <CircularProgress size={14} /> : <DeleteOutlined fontSize="small" color="error" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>

      <Collapse in={expanded || (search && childMatchesSearch)} timeout="auto">
        <Box sx={{ ml: { xs: 1, sm: 3 } }}>
          {adding && (
            <InlineAddForm
              placeholder="Nombre del indicador de evaluación"
              onAdd={handleAddSubObjective}
              onCancel={() => setAdding(false)}
              loading={loading}
            />
          )}
          {objective.subObjectives?.map((so) => {
            const soMatches = !search || so.name.toLowerCase().includes(search.toLowerCase()) || matchesSearch;
            if (!soMatches) return null;
            return (
              <SubObjectiveRow
                key={so.id}
                subObjective={so}
                objectiveId={objective.id}
                institutionId={institutionId}
                mutateTree={mutateTree}
                search={search}
              />
            );
          })}
          {subCount === 0 && !adding && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 10, py: 1, display: 'block' }}>
              Sin indicadores de evaluación
            </Typography>
          )}
        </Box>
      </Collapse>

      <Snackbar open={error} autoHideDuration={4000} onClose={() => setError(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(false)}>Error al procesar la solicitud</Alert>
      </Snackbar>
    </>
  );
}

function CurricularObjectiveSection({ curricularObjective, institutionId, mutateTree, search }) {
  const { setTitle, setDescription, setOpen, handleOnConfirmChange } = useContext(DialogContext);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objCount = curricularObjective.objectives?.length || 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    const linkedMsg = objCount > 0
      ? ` Los ${objCount} indicador(es) de informe asociados no se eliminarán, pero quedarán sin OA asociado.`
      : '';
    setTitle('¿Quieres eliminar este objetivo curricular?');
    setDescription(`Esta acción es irreversible.${linkedMsg}`);
    handleOnConfirmChange(async () => {
      setOpen(false);
      setLoading(true);
      try {
        await axios.delete(
          `/api/institutions/${institutionId}/curricular-objectives/${curricularObjective.id}`
        );
        await mutateTree();
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    });
    setOpen(true);
  };

  const matchesSearch = search && curricularObjective.name.toLowerCase().includes(search.toLowerCase());
  const childMatchesSearch = search && curricularObjective.objectives?.some(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.subObjectives?.some((so) => so.name.toLowerCase().includes(search.toLowerCase()))
  );
  const shouldShow = !search || matchesSearch || childMatchesSearch;

  if (!shouldShow) return null;

  return (
    <Box sx={{ mb: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          pl: { xs: 1, sm: 2 },
          pr: 1,
          py: 0.75,
          borderLeft: `3px solid ${LEVEL_COLORS[1]}`,
          backgroundColor: LEVEL_BG[1],
          borderRadius: '0 6px 6px 0',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: 'rgba(159,191,213,0.18)' },
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <IconButton size="small">
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
        <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
          {highlightMatch(curricularObjective.name, search)}
        </Typography>
        {objCount > 0 && (
          <Chip label={`${objCount} ind.`} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: LEVEL_COLORS[2], color: '#fff' }} />
        )}
        {curricularObjective.levels?.length > 0 && (
          <Stack direction="row" spacing={0.5}>
            {curricularObjective.levels.map((level) => (
              <Chip key={level.id} label={level.name} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            ))}
          </Stack>
        )}
        <Tooltip title="Eliminar objetivo curricular">
          <IconButton size="small" onClick={handleDelete} disabled={loading}>
            {loading ? <CircularProgress size={14} /> : <DeleteOutlined fontSize="small" color="error" />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Snackbar open={error} autoHideDuration={4000} onClose={() => setError(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(false)}>Error al eliminar el objetivo curricular</Alert>
      </Snackbar>

      <Collapse in={expanded || (search && childMatchesSearch)} timeout="auto">
        <Box sx={{ ml: { xs: 0, sm: 2 }, mt: 0.5 }}>
          {curricularObjective.objectives?.map((obj) => (
            <ObjectiveRow
              key={obj.id}
              objective={obj}
              institutionId={institutionId}
              mutateTree={mutateTree}
              search={search}
            />
          ))}
          {objCount === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 6, py: 1, display: 'block' }}>
              Sin indicadores de informe asociados
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function CoreSection({ core, institutionId, mutateTree, search, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const oaCount = core.curricularObjectives?.length || 0;
  const unlinkedCount = core.unlinkedObjectives?.length || 0;
  const totalObjectives = (core.curricularObjectives?.reduce((acc, co) => acc + (co.objectives?.length || 0), 0) || 0) + unlinkedCount;

  const matchesSearch = search && core.name.toLowerCase().includes(search.toLowerCase());
  const childMatchesSearch = search && (
    core.curricularObjectives?.some(
      (co) => co.name.toLowerCase().includes(search.toLowerCase()) ||
        co.objectives?.some(
          (o) => o.name.toLowerCase().includes(search.toLowerCase()) ||
            o.subObjectives?.some((so) => so.name.toLowerCase().includes(search.toLowerCase()))
        )
    ) ||
    core.unlinkedObjectives?.some(
      (o) => o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.subObjectives?.some((so) => so.name.toLowerCase().includes(search.toLowerCase()))
    )
  );
  const shouldShow = !search || matchesSearch || childMatchesSearch;

  if (!shouldShow) return null;

  return (
    <Paper elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 2,
          py: 1.5,
          borderLeft: `4px solid ${LEVEL_COLORS[0]}`,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: 'rgba(251,159,113,0.06)' },
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <AccountTree sx={{ color: LEVEL_COLORS[0] }} />
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          {highlightMatch(core.name, search)}
        </Typography>
        <Chip
          label={`${oaCount} OA`}
          size="small"
          sx={{ height: 22, fontSize: '0.75rem', bgcolor: LEVEL_COLORS[1], color: '#fff' }}
        />
        <Chip
          label={`${totalObjectives} ind.`}
          size="small"
          sx={{ height: 22, fontSize: '0.75rem', bgcolor: LEVEL_COLORS[2], color: '#fff' }}
        />
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Stack>

      <Collapse in={expanded || (search && childMatchesSearch)} timeout="auto">
        <Box sx={{ px: { xs: 1, sm: 2 }, pb: 2, pt: 1 }}>
          {core.curricularObjectives?.map((co) => (
            <CurricularObjectiveSection
              key={co.id}
              curricularObjective={co}
              institutionId={institutionId}
              mutateTree={mutateTree}
              search={search}
            />
          ))}

          {unlinkedCount > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ pl: 1, pb: 0.5, display: 'block' }}>
                Indicadores sin OA asociado
              </Typography>
              {core.unlinkedObjectives.map((obj) => (
                <ObjectiveRow
                  key={obj.id}
                  objective={obj}
                  institutionId={institutionId}
                  mutateTree={mutateTree}
                  search={search}
                />
              ))}
            </Box>
          )}

          {oaCount === 0 && unlinkedCount === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 2, py: 2 }}>
              Este núcleo no tiene objetivos curriculares ni indicadores configurados.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function ObjectivesTreeConfiguration() {
  const { institutionId } = useContext(InstitutionConfigurationContext);
  const { data: treeResponse, mutate: mutateTree } = useSWR(
    `/api/institutions/${institutionId}/objectives-tree`,
    axios
  );
  const [search, setSearch] = useState('');
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandKey, setExpandKey] = useState(0);

  const tree = treeResponse?.data;

  const handleExpandAll = useCallback(() => {
    setAllExpanded(true);
    setExpandKey((k) => k + 1);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setAllExpanded(false);
    setExpandKey((k) => k + 1);
  }, []);

  const stats = useMemo(() => {
    if (!tree) return null;
    let cores = tree.length;
    let oas = 0;
    let objectives = 0;
    let subObjectives = 0;
    for (const core of tree) {
      oas += core.curricularObjectives?.length || 0;
      objectives += core.unlinkedObjectives?.length || 0;
      for (const co of core.curricularObjectives || []) {
        objectives += co.objectives?.length || 0;
        for (const o of co.objectives || []) {
          subObjectives += o.subObjectives?.length || 0;
        }
      }
      for (const o of core.unlinkedObjectives || []) {
        subObjectives += o.subObjectives?.length || 0;
      }
    }
    return { cores, oas, objectives, subObjectives };
  }, [tree]);

  if (!tree) return <UngaCircularProgress />;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar en todos los niveles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UnfoldMore />}
            onClick={handleExpandAll}
          >
            Expandir todo
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UnfoldLess />}
            onClick={handleCollapseAll}
          >
            Colapsar todo
          </Button>
        </Stack>
      </Stack>

      {stats && (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Chip icon={<AccountTree />} label={`${stats.cores} Núcleos`} size="small" sx={{ bgcolor: LEVEL_COLORS[0], color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />
          <Chip label={`${stats.oas} Obj. Curriculares`} size="small" sx={{ bgcolor: LEVEL_COLORS[1], color: '#fff' }} />
          <Chip label={`${stats.objectives} Ind. de informe`} size="small" sx={{ bgcolor: LEVEL_COLORS[2], color: '#fff' }} />
          <Chip label={`${stats.subObjectives} Ind. de evaluación`} size="small" sx={{ bgcolor: LEVEL_COLORS[3], color: '#fff' }} />
        </Stack>
      )}

      {tree.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AccountTree sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No hay núcleos configurados para esta institución.
          </Typography>
        </Paper>
      ) : (
        tree.map((core) => (
          <CoreSection
            key={`${core.id}-${expandKey}`}
            core={core}
            institutionId={institutionId}
            mutateTree={mutateTree}
            search={search}
            defaultExpanded={allExpanded}
          />
        ))
      )}
    </Stack>
  );
}
