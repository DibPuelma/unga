import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { PrintOutlined } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import ObservationCard from './ObservationCard';
import Searchbar from '../utils/Searchbar';
import PrintObservations from './PrintObservations';

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
  report = false,
}) {
  const [searchText, setSearchText] = React.useState('');
  const [filteredObservations, setFilteredObservations] = useState(observations);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const printableObservationsRef = useRef();

  useEffect(() => {
    setFilteredObservations(observations);
  }, [observations]);

  const handleSearchTextChange = ({ target: { value } }) => {
    setSearchText(value);
    setFilteredObservations(observations.filter((so) => (
      so.description.toLowerCase().includes(value.toLowerCase())
    )));
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

  const toggleSelect = () => {
    setSelecting((oldValue) => !oldValue)
  }

  const handleCancelPrint = () => {
    setSelectedObservations([]);
    toggleSelect();
  }

  const handlePrint = useReactToPrint({
    content: () => printableObservationsRef.current,
    pageStyle: 'margin: 2cm;',
  });

  const PrintingButton = () => {
    if (selecting) {
      return (
        <Stack direction="row" columnGap={2}>
          <Button color="error" onClick={handleCancelPrint}>
            Cancelar
          </Button>
          {selectedObservations.length > 0 ? (
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={handlePrint}
              startIcon={<PrintOutlined />}
            >
              Confirmar impresión
            </Button>
          ) : (
            <Button fullWidth disabled variant="outlined">Selecciona las observaciones</Button>
          )}

        </Stack>
      )
    } else {
      return (
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={toggleSelect}
          startIcon={<PrintOutlined />}
        >
          Imprimir observaciones
        </Button>
      )
    }
  }

  return (
    <Box width="100%">
      {observations.length === 0 ? (
        <Typography textAlign="center">
          {emptyText}
        </Typography>
      ) : (
        <Box>
          {(!noSearch || printable) && (
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
            {printable && (
              <Box width={{ xs: '100%', sm: '40%' }}>
                <PrintingButton />
              </Box>
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
                onSelect={printable && selecting ? handleSelect : onSelect}
                onRemove={handleRemove}
                report={report}
                noName={noName}
                noActions={noActions}
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
    </Box>
  )
};
