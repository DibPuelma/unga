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
  // \b is ASCII-only and misses boundaries next to accented letters (Antú, algodón).
  const pattern = new RegExp(`(?<!\\p{L})${escapeRegExp(word)}(?!\\p{L})`, 'giu');
  return description.replace(pattern, (match) => (
    match[0] === match[0].toUpperCase()
      ? suggestion[0].toUpperCase() + suggestion.slice(1)
      : suggestion
  ));
}

const correctionKey = (observationId, word) => `${observationId}:${word.toLowerCase()}`;

// Confirmation step before bulk-applying spelling corrections: these are
// official child records, so nothing gets changed silently. Shows exactly
// which word → suggestion swaps will happen per record, and lets the
// educator exclude a whole record or tap individual chips to drop just the
// suggestions that don't look right.
export default function SpellcheckCorrectionDialog({ open, onClose, observations, spellingIssuesById, onApplied }) {
  const [includedIds, setIncludedIds] = useState([]);
  const [excludedWords, setExcludedWords] = useState(() => new Set());
  const [applying, setApplying] = useState(false);

  const corrections = useMemo(() => observations.map((observation) => {
    const issues = (spellingIssuesById[observation.id] || []).filter((issue) => issue.suggestions?.length > 0);
    const activeIssues = issues.filter((issue) => !excludedWords.has(correctionKey(observation.id, issue.word)));
    const correctedDescription = activeIssues.reduce((description, issue) => (
      applyCorrection(description, issue.word, issue.suggestions[0])
    ), observation.description);
    return { observation, issues, activeIssues, correctedDescription };
  }).filter(({ issues }) => issues.length > 0), [observations, spellingIssuesById, excludedWords]);

  useEffect(() => {
    if (open) {
      setIncludedIds(corrections.map(({ observation }) => observation.id));
      setExcludedWords(new Set());
    }
  }, [open]);

  const toggleIncluded = (id) => {
    setIncludedIds((oldValue) => (
      oldValue.includes(id) ? oldValue.filter((includedId) => includedId !== id) : [...oldValue, id]
    ));
  }

  const toggleWord = (observationId, word) => {
    setExcludedWords((oldValue) => {
      const newValue = new Set(oldValue);
      const key = correctionKey(observationId, word);
      if (newValue.has(key)) newValue.delete(key);
      else newValue.add(key);
      return newValue;
    });
  }

  const toApply = corrections.filter(({ observation, activeIssues }) => (
    includedIds.includes(observation.id) && activeIssues.length > 0
  ));

  const handleConfirm = async () => {
    setApplying(true);
    try {
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
          Se reemplazará cada palabra marcada por su sugerencia. Revisa los cambios antes de
          aplicarlos: puedes tocar una sugerencia para descartarla sin excluir el resto.
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
                  {issues.map((issue) => {
                    const excluded = excludedWords.has(correctionKey(observation.id, issue.word));
                    return (
                      <Chip
                        key={issue.word}
                        size="small"
                        color={excluded ? 'default' : 'warning'}
                        variant="outlined"
                        label={`${issue.word} → ${issue.suggestions[0]}`}
                        onClick={() => toggleWord(observation.id, issue.word)}
                        sx={excluded ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}
                      />
                    );
                  })}
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
          disabled={toApply.length === 0}
          onClick={handleConfirm}
        >
          Aplicar correcciones ({toApply.length})
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
