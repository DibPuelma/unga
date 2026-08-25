import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { PrintOutlined, SpellcheckOutlined } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import ObservationCard from './ObservationCard';
import Searchbar from '../utils/Searchbar';
import PrintObservations from './PrintObservations';
import SpellcheckCorrectionDialog from './SpellcheckCorrectionDialog';

const matchesObservation = (observation, query) => {
  const normalizedQuery = query.toLowerCase();
  if (observation.description.toLowerCase().includes(normalizedQuery)) return true;
  return (observation.students || []).some((student) => (
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(normalizedQuery)
  ));
}

export default function ObservationsList({
  observations = [],
  columns,
  onSelect,
  onRemove,
  noSearch,
  noName,
  noActions,
  emptyText,
  printable,
  spellcheckable,
  classroomId,
  startDate,
  endDate,
  report = false,
}) {
  const router = useRouter();
  const [searchText, setSearchText] = React.useState('');
  const [filteredObservations, setFilteredObservations] = useState(observations);
  const [selectedObservations, setSelectedObservations] = useState([]);
  // null | 'print' | 'correct' — which checkbox-selection flow is active, if any.
  const [selectionMode, setSelectionMode] = useState(null);
  const [spellingIssuesById, setSpellingIssuesById] = useState({});
  const [spellcheckRan, setSpellcheckRan] = useState(false);
  const [spellcheckLoading, setSpellcheckLoading] = useState(false);
  const [onlyWithErrors, setOnlyWithErrors] = useState(false);
  const [autoCorrectDialogOpen, setAutoCorrectDialogOpen] = useState(false);
  const printableObservationsRef = useRef();

  useEffect(() => {
    let result = observations.filter((so) => matchesObservation(so, searchText));
    if (onlyWithErrors) {
      result = result.filter((so) => (spellingIssuesById[so.id]?.length > 0));
    }
    setFilteredObservations(result);
  }, [observations, searchText, onlyWithErrors, spellingIssuesById]);

  const handleSearchTextChange = ({ target: { value } }) => {
    setSearchText(value);
  }

  const handleRemove = (id) => {
    setFilteredObservations(oldValue => oldValue.filter((observation) => observation.id !== id))
    onRemove && onRemove(id)
  }

  const handleSelect = (checked, observation) => {
    if (checked) {
      setSelectedObservations(oldValue => [...oldValue, observation]);
    } else {
      setSelectedObservations(oldValue => oldValue.filter((so) => so.id !== observation.id));
    }
    onSelect && onSelect(checked, observation);
  }

  const toggleSelectionMode = (mode) => {
    setSelectedObservations([]);
    setSelectionMode((oldValue) => (oldValue === mode ? null : mode));
  }

  const handlePrint = useReactToPrint({
    content: () => printableObservationsRef.current,
    pageStyle: 'margin: 2cm;',
  });

  const handleRunSpellcheck = async () => {
    setSpellcheckLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate.format('YYYY-MM-DD'));
        params.set('endDate', endDate.format('YYYY-MM-DD'));
      }
      const { data } = await axios.get(`/api/classrooms/${classroomId}/observations/spellcheck?${params.toString()}`);
      setSpellingIssuesById(data.data.reduce((acc, { id, words }) => ({ ...acc, [id]: words }), {}));
      setSpellcheckRan(true);
    } finally {
      setSpellcheckLoading(false);
    }
  }

  const handleManualCorrect = () => {
    const [first, ...rest] = selectedObservations;
    if (!first) return;
    const params = new URLSearchParams({ spellcheckTotal: String(selectedObservations.length) });
    if (rest.length > 0) params.set('spellcheckQueue', rest.map((observation) => observation.id).join(','));
    router.push(`/classes/${classroomId}/observations/${first.id}/edit?${params.toString()}`);
  }

  const handleAutoCorrectApplied = (correctedIds) => {
    setSpellingIssuesById((oldValue) => {
      const updated = { ...oldValue };
      correctedIds.forEach((id) => delete updated[id]);
      return updated;
    });
    setSelectedObservations([]);
    setSelectionMode(null);
    setAutoCorrectDialogOpen(false);
  }

  const SelectionToolbar = () => {
    if (!selectionMode) {
      return (
        <Stack direction="row" columnGap={2}>
          {printable && (
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => toggleSelectionMode('print')}
              startIcon={<PrintOutlined />}
            >
              Imprimir observaciones
            </Button>
          )}
          {spellcheckable && onlyWithErrors && (
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              onClick={() => toggleSelectionMode('correct')}
              startIcon={<SpellcheckOutlined />}
            >
              Seleccionar para corregir
            </Button>
          )}
        </Stack>
      )
    }

    return (
      <Stack direction="row" columnGap={2}>
        <Button color="error" onClick={() => toggleSelectionMode(selectionMode)}>
          Cancelar
        </Button>
        {selectedObservations.length === 0 && (
          <Button fullWidth disabled variant="outlined">Selecciona las observaciones</Button>
        )}
        {selectedObservations.length > 0 && selectionMode === 'print' && (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={handlePrint}
            startIcon={<PrintOutlined />}
          >
            Confirmar impresión
          </Button>
        )}
        {selectedObservations.length > 0 && selectionMode === 'correct' && (
          <>
            <Button fullWidth variant="outlined" color="warning" onClick={handleManualCorrect}>
              Corregir manualmente
            </Button>
            <Button fullWidth variant="contained" color="warning" onClick={() => setAutoCorrectDialogOpen(true)}>
              Corregir automáticamente
            </Button>
          </>
        )}
      </Stack>
    )
  }

  return (
    <Box width="100%">
      {observations.length === 0 ? (
        <Typography textAlign="center">
          {emptyText}
        </Typography>
      ) : (
        <Box>
          {(!noSearch || printable || spellcheckable) && (
          <Stack width="100%" mb={2} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 8 }} justifyContent="space-between">
            {!noSearch && (
              <Searchbar
                fullWidth
                value={searchText}
                onChange={handleSearchTextChange}
                placeholder="Buscar observaciones"
                sx={{ width: { xs: '100%', sm: '60%' } }}
              />
            )}
            {(printable || spellcheckable) && (
              <Box width={{ xs: '100%', sm: '40%' }}>
                <SelectionToolbar />
              </Box>
            )}
          </Stack>
          )}
          {spellcheckable && !selectionMode && (
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} mb={2}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={spellcheckLoading ? <CircularProgress size={16} /> : <SpellcheckOutlined />}
                disabled={spellcheckLoading}
                onClick={handleRunSpellcheck}
              >
                Revisar ortografía
              </Button>
              {spellcheckRan && (
                <FormControlLabel
                  control={<Switch checked={onlyWithErrors} onChange={(e) => setOnlyWithErrors(e.target.checked)} />}
                  label="Solo con errores"
                />
              )}
            </Stack>
          )}
          <Grid container columns={columns} spacing={1}>
            {filteredObservations.length === 0 && (
              <Typography mt={2} textAlign="center" width="100%">
                No hay resultados para esa búsqueda
              </Typography>
            )}
            {filteredObservations.map((observation) => (
              <ObservationCard
                observation={observation}
                key={observation.id}
                onSelect={selectionMode ? handleSelect : onSelect}
                checked={selectionMode ? selectedObservations.some((so) => so.id === observation.id) : undefined}
                onRemove={handleRemove}
                report={report}
                noName={noName}
                noActions={noActions}
                spellingIssuesCount={spellingIssuesById[observation.id]?.length || 0}
              />
            ))}
          </Grid>
        </Box>
      )}
      <Box display="none">
        <Box ref={printableObservationsRef}>
          <PrintObservations observations={selectedObservations} />
        </Box>
      </Box>
      {spellcheckable && (
        <SpellcheckCorrectionDialog
          open={autoCorrectDialogOpen}
          onClose={() => setAutoCorrectDialogOpen(false)}
          observations={selectedObservations}
          spellingIssuesById={spellingIssuesById}
          onApplied={handleAutoCorrectApplied}
        />
      )}
    </Box>
  )
};
