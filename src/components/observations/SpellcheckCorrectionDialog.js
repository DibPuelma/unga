import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const applyCorrection = (description, word, suggestion) => {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'giu');
  return description.replace(pattern, (match) => (
    match[0] === match[0].toUpperCase()
      ? suggestion[0].toUpperCase() + suggestion.slice(1)
      : suggestion
  ));
}

// Confirmation step before bulk-applying spelling corrections: these are
// official child records, so nothing gets changed silently. Shows exactly
// which word → suggestion swaps will happen per record, and lets the
// educator exclude any record whose suggestions don't look right.
export default function SpellcheckCorrectionDialog({ open, onClose, observations, spellingIssuesById, onApplied }) {
  const [includedIds, setIncludedIds] = useState([]);
  const [applying, setApplying] = useState(false);

  const corrections = useMemo(() => observations.map((observation) => {
    const issues = (spellingIssuesById[observation.id] || []).filter((issue) => issue.suggestions?.length > 0);
    const correctedDescription = issues.reduce((description, issue) => (
      applyCorrection(description, issue.word, issue.suggestions[0])
    ), observation.description);
    return { observation, issues, correctedDescription };
  }).filter(({ issues }) => issues.length > 0), [observations, spellingIssuesById]);

  useEffect(() => {
    if (open) setIncludedIds(corrections.map(({ observation }) => observation.id));
  }, [open]);

  const toggleIncluded = (id) => {
    setIncludedIds((oldValue) => (
      oldValue.includes(id) ? oldValue.filter((includedId) => includedId !== id) : [...oldValue, id]
    ));
  }

  const handleConfirm = async () => {
    setApplying(true);
    try {
      const toApply = corrections.filter(({ observation }) => includedIds.includes(observation.id));
      await Promise.all(toApply.map(({ observation, correctedDescription }) => (
        axios.patch(`/api/observations/${observation.id}`, { description: correctedDescription })
      )));
      onApplied(toApply.map(({ observation }) => observation.id));
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar corrección automática</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Se reemplazará cada palabra marcada por su sugerencia. Revisa los cambios antes de aplicarlos.
        </Typography>
        <Stack divider={<Divider />} rowGap={2}>
          {corrections.map(({ observation, issues }) => (
            <Stack key={observation.id} direction="row" spacing={1} alignItems="flex-start">
              <Checkbox
                checked={includedIds.includes(observation.id)}
                onChange={() => toggleIncluded(observation.id)}
              />
              <Stack>
                <Typography variant="body2">{observation.description}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                  {issues.map((issue) => (
                    <Chip
                      key={issue.word}
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={`${issue.word} → ${issue.suggestions[0]}`}
                    />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <LoadingButton onClick={onClose} disabled={applying}>Cancelar</LoadingButton>
        <LoadingButton
          variant="contained"
          color="warning"
          loading={applying}
          disabled={includedIds.length === 0}
          onClick={handleConfirm}
        >
          Aplicar correcciones ({includedIds.length})
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
