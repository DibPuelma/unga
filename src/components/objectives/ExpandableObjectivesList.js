import { DragIndicator } from '@mui/icons-material';
import { Box, IconButton, Stack } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import ExpandableObjectiveListItem from './ExpandableObjectiveListItem';
import NewFormSimple from './NewFormSimple';


export default function ExpandableObjectivesList({
  core = null,
  withSubObjectives = false,
  objectives,
  onExpand = () => { },
  onCollapse = () => { },
  onCreate,
  onDragEnd,
  evaluationDate,
}) {
  const [expandedId, setExpandedId] = useState();
  const { query: { classroomId } } = useRouter();
  const handleExpand = (id) => {
    setExpandedId(id);
    onExpand(id);
  }

  const handleCollapse = () => {
    setExpandedId(null);
    onCollapse();
  }

  const handleOnDragEnd = (result) => {
    if (!onDragEnd) return;
    const { destination, source } = result;
    let newObjectives = [...objectives];
    const movedItem = newObjectives.splice(source.index, 1)[0];
    const type = movedItem.objective ? 'subObjective' : 'objective';
    const pathType = type === 'subObjective' ? 'sub-objectives' : 'objectives';
    newObjectives = [
      ...newObjectives.slice(0, destination.index),
      movedItem,
      ...newObjectives.slice(destination.index, newObjectives.length)
    ].map((objective, i) => {
      axios.patch(`/api/classrooms/${classroomId}/${pathType}/${objective.id}`, { position: i })
      return { ...objective, position: i }
    });
    onDragEnd(newObjectives, type);
  }

  return (
    <>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='droppable'>
          {(provided) => (
            <Stack spacing={4}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {objectives.map((objective, i) => (
                <Draggable
                  key={objective.id}
                  draggableId={objective.id}
                  index={i}
                >
                  {(provided) => (
                    <Stack
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      direction="row"
                      alignItems="center"
                    >
                      {onDragEnd && (
                        <IconButton sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                          <DragIndicator />
                        </IconButton>
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <ExpandableObjectiveListItem
                          index={i}
                          withSubObjectives={withSubObjectives}
                          objective={objective}
                          onExpand={() => handleExpand(objective.id)}
                          expanded={expandedId === objective.id}
                          onCollapse={() => handleCollapse()}
                          evaluationDate={evaluationDate}
                        />
                      </Box>
                    </Stack>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </DragDropContext>
      {onCreate && core && (
        <Box mt={2} pl={5}>
          <NewFormSimple
            onCreate={onCreate}
            coreId={core.id}
          />
        </Box>
      )}
    </>
  )
}