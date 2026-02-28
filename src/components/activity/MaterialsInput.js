import { Add, DeleteOutlined } from "@mui/icons-material";
import { Button, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

export default function MaterialsInput({ onChange, values = [] }) {
  const [materials, setMaterials] = useState(values);

  useEffect(() => {
    if (values.length === 0) {
      setMaterials(values);
    }
  }, [values])

  const handleMaterialChange = ({ target: { value, name } }, id) => {
    const updatedMaterialIndex = materials.findIndex((material) => material.id === id);
    const updatedMaterials = [...materials];
    updatedMaterials[updatedMaterialIndex][name] = value;
    setMaterials(updatedMaterials);
    onChange(updatedMaterials);
  }

  const handleAddMaterial = () => {
    const updatedMaterials = [
      ...materials,
      { name: '', quantityText: '', isNew: true, id: Math.random().toString() }
    ];
    setMaterials(updatedMaterials);
    onChange(updatedMaterials);
  }

  const handleRemoveMaterial = (id) => {
    const indexToRemove = materials.findIndex((material) => material.id === id);
    const updatedMaterials = [
      ...materials.slice(0, indexToRemove),
      ...materials.slice(indexToRemove + 1, materials.lenght)
    ];
    setMaterials(updatedMaterials);
    onChange(updatedMaterials);
  }

  const getMaterialFields = (material) => (
    <Grid container spacing={1} mb={1}>
      <Grid item xs={5} sm={4} md={3} lg={2}>
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          label="Nombre del material"
          value={material.name}
          name="name"
          onChange={(e) => handleMaterialChange(e, material.id)}
        />
      </Grid>
      <Grid item xs={5} sm={4} md={3} lg={2}>
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          label="Cantidad necesaria"
          value={material.quantityText}
          name="quantityText"
          onChange={(e) => handleMaterialChange(e, material.id)}
        />
      </Grid>
      <Grid item xs={2} sm={1}>
        <IconButton onClick={() => handleRemoveMaterial(material.id)}>
          <DeleteOutlined color="error" />
        </IconButton>
      </Grid>
    </Grid>
  )

  const getMaterialData = (material) => (
    <Grid container>
      <Grid item xs={6}>
        <Typography>{material.name}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography>{material.quantityText}</Typography>
      </Grid>
    </Grid>
  )

  return (
    <Stack alignItems={{ xs: 'inherit', sm: "flex-start" }}>
      {materials.map((material) => (
        <React.Fragment key={material.id}>
          {material.isNew ? getMaterialFields(material) : getMaterialData(material)}
        </React.Fragment>
      ))}
      <Button
        sx={{ mt: 1 }}
        startIcon={<Add />}
        variant="contained"
        onClick={handleAddMaterial}
      >
        Agregar material
      </Button>
    </Stack>
  )
}