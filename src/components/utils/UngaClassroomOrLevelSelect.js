import { FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useContext } from "react";
import { UserContext } from "src/context/UserContext";
import UngaSelect from "./UngaSelect";

export default function UngaClassroomOrLevelSelect({
  formErrors,
  classroom,
  classroomsToSelect,
  level,
  levelsToSelect,
  handleSelectChange,
  classroomOrLevel,
  handleRadioChange,
}) {

  const { user } = useContext(UserContext);

  const ClassroomSelect = (
    <UngaSelect
      fullWidth
      error={formErrors && !Boolean(classroom)}
      label="Sala"
      labelId="select-classroom-label"
      name="classroom"
      id="select-classroom"
      value={classroom}
      onChange={handleSelectChange}
      options={classroomsToSelect}
      errorText="Escoge la sala"
    />
  )

  const LevelSelect = (
    <UngaSelect
      fullWidth
      error={formErrors && !Boolean(level)}
      label="Nivel"
      labelId="select-level-label"
      name="level"
      id="select-level"
      value={level}
      onChange={handleSelectChange}
      options={levelsToSelect}
      errorText="Escoge el nivel"
    />
  )
  if (user.role === 'teacher') {
    return ClassroomSelect;
  } else {
    return (
      <>
        <FormControl>
          <RadioGroup
            row
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={classroomOrLevel}
            onChange={handleRadioChange}
          >
            <FormControlLabel value="classroom" control={<Radio />} label="Crear para una sala" />
            <FormControlLabel value="level" control={<Radio />} label="Crear para todo el nivel" />
          </RadioGroup>
        </FormControl>
        {classroomOrLevel === 'classroom' ? ClassroomSelect : LevelSelect}
      </>
    );
  }
}