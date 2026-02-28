import React, { Fragment, useContext, useMemo, useState } from 'react';
import { Box, CircularProgress, Grid, IconButton, Typography } from '@mui/material';

import { AdvancedReportContext } from 'src/context/AdvancedReportContext';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import TimePeriodsHeader from './TimePeriodsHeader';
import { toAcronym } from 'src/helpers/strings';
import { getLevelOfAchievementValueColor } from 'src/helpers/businessLogic';
import { UserContext } from 'src/context/UserContext';
import ChooseLevelOfAchievement from '../levelsOfAchievement/ChooseLevelOfAchievement';

export default function ReportObjectivesList({
  objectives,
  timePeriods,
  coreId,
}) {
  const { levelsOfAchievement } = useContext(UserContext);
  const {
    toggleHideObjective,
    hiddenObjectives: contextHiddenObjectives,
    printing,
    showSubObjectives,
    classroomReportConfiguration: { allowEvaluations },
    student,
    setEvaluatedObjective,
  } = useContext(AdvancedReportContext);
  const [hiddenObjectives, setHiddenObjectives] = useState(
    contextHiddenObjectives.reduce((acc, value) => ({ ...acc, [value]: true }), {})
  );
  const [loading, setLoading] = useState({});

  const firstTimePeriod = useMemo(() => timePeriods.length > 0 ? timePeriods[0] : null, [timePeriods]);


  const handleHideObjective = async (id) => {
    setLoading((oldValue) => ({ ...oldValue, [id]: true }));
    const success = await toggleHideObjective(id)
    setLoading((oldValue) => ({ ...oldValue, [id]: false }));
    if (!success) return;

    setHiddenObjectives((oldValue) => ({ ...oldValue, [id]: !oldValue[id] }));
  }

  const handleEvaluation = ({ objectiveId, levelOfAchievement, timePeriod }) => {
    const timePeriodName = timePeriod.name;
    setEvaluatedObjective({ objectiveId, levelOfAchievement, timePeriodName, coreId });
  }

  if (!firstTimePeriod?.name) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <style>
        {`
          table {
            width: 100%;
          }
          th {
            text-align: left;
            padding-bottom: 0.5rem;
          }
          td {
            min-width: 50px;
            padding-top: 0.5rem;
          }
          .td-no-padding {
            padding: 0;
          }
        `}
      </style>
      <table>
        <thead>
          <tr>
            {!printing && <th />}
            <th>
              <Typography
                variant="caption"
                textAlign="left"
                fontWeight="bold"
              >
                Indicador
              </Typography>
            </th>
            <TimePeriodsHeader timePeriods={timePeriods} printing={printing} timePeriodsToShow={timePeriods.length} />
          </tr>
        </thead>
        <tbody>
          {objectives[firstTimePeriod.name].map((objective, i) => {
            if (printing && hiddenObjectives[objective.id]) return null;
            else {
              return (
                <Fragment key={objective.id}>
                  <tr>
                    {!printing && (
                      <td>
                        <Box xs={1} pl={0} justifyContent="center">
                          {loading[objective.id] ? (
                            <IconButton disabled>
                              <CircularProgress size={22} />
                            </IconButton>
                          ) : (
                            <IconButton sx={{ xs: { pl: 0 } }}
                              onClick={() => handleHideObjective(objective.id)}
                              color={hiddenObjectives[objective.id] ? 'error' : 'primary'}
                            >
                              {hiddenObjectives[objective.id] ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                            </IconButton>
                          )}
                        </Box>
                      </td>
                    )}
                    <td>
                      <Typography
                        mr={2}
                        fontSize={14}
                        lineHeight={1.4}
                        sx={{
                          textDecoration: hiddenObjectives[objective.id] ? 'line-through' : 'none',
                          breakInside: 'avoid',
                        }}
                      >
                        {objective.name}
                      </Typography>
                    </td>
                    {timePeriods.map((timePeriod) => (
                      <td key={timePeriod.name}>
                        {allowEvaluations ? (
                          <ChooseLevelOfAchievement
                            evaluationDate={timePeriod.date}
                            objective={objectives[timePeriod.name][i]}
                            student={student}
                            currentValue={objectives[timePeriod.name][i].levelOfAchievement?.id}
                            type="select"
                            onChange={({ levelOfAchievement, objectiveId }) => handleEvaluation({ objectiveId, levelOfAchievement, timePeriod })}
                          />
                        ) : (
                          <Typography
                            fontSize={14}
                            textAlign="center"
                            color={getLevelOfAchievementValueColor(objectives[timePeriod.name][i].levelOfAchievement?.value, levelsOfAchievement.length - 1)}
                          >
                            <b>{toAcronym(objectives[timePeriod.name][i].levelOfAchievement?.name)}</b>
                          </Typography>
                        )}
                      </td>
                    ))}
                  </tr>
                  {
                    showSubObjectives && objective.subObjectives?.map((subObjective) => (
                      <tr key={subObjective.id}>
                        {!printing && <td className="td-no-padding" />}
                        <td className="td-no-padding">
                          <Typography fontSize={10} lineHeight={1.2} sx={{
                            textDecoration: hiddenObjectives[objective.id] ? 'line-through' : 'none'
                          }}>
                            {subObjective.name}
                          </Typography>
                        </td>
                        {timePeriods.map((timePeriod) => (
                          <td className="td-no-padding">
                            {allowEvaluations ? (
                              <ChooseLevelOfAchievement
                                evaluationDate={timePeriod.date}
                                objective={subObjective}
                                student={student}
                                currentValue={subObjective.levelOfAchievement?.id}
                                type="select"
                                size="small"
                                onChange={({ levelOfAchievement, objectiveId }) => handleEvaluation({ objectiveId, levelOfAchievement, timePeriod })}
                              />
                            ) : (
                              <Typography
                                fontSize={10}
                                textAlign="center"
                                color={getLevelOfAchievementValueColor(subObjective.levelOfAchievement?.value, levelsOfAchievement.length - 1)}
                              >
                                <b>{toAcronym(subObjective.levelOfAchievement?.name)}</b>
                              </Typography>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  }
                </Fragment>
              )
            }
          })}
        </tbody>
      </table>
    </Box >
  );
};
