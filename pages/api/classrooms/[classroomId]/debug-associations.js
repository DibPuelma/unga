import prisma from 'lib/prisma';
import { getClassroom } from 'db/class';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const { classroomId } = req.query;
  const { user } = session;
  const { role, classrooms, institution } = user;

  // Check authorization
  if (role === 'teacher' || role === 'coordinator') {
    if (!classrooms.includes(classroomId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }
  } else if (role === 'principal') {
    const classroom = await getClassroom(classroomId);
    if (!classroom || classroom.institutionId !== institution.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }
  } else if (role !== 'superAdmin') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    const classroom = await prisma.classes.findUnique({
      where: { id: classroomId },
      include: {
        Levels: true,
        Institutions: true,
      },
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }

    // Get all objectives associated with this classroom
    const objectives = await prisma.objectives.findMany({
      where: {
        Classes: {
          some: { id: classroomId },
        },
        deletedAt: null,
      },
      include: {
        Cores: true,
        ObjectiveLevels: {
          include: {
            Levels: true,
          },
        },
        SubObjectives: {
          where: {
            deletedAt: null,
          },
          include: {
            Classes: true,
            Levels: true,
          },
        },
        _count: {
          select: {
            SubObjectives: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
        Classes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Get all sub-objectives associated with this classroom
    const subObjectives = await prisma.subObjectives.findMany({
      where: {
        Classes: {
          some: { id: classroomId },
        },
        deletedAt: null,
      },
      include: {
        Objectives: {
          include: {
            Classes: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        Cores: true,
        Levels: true,
        Classes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Also get sub-objectives that belong to objectives associated with this classroom
    // but might not be directly associated with the classroom
    const subObjectivesFromObjectives = await prisma.subObjectives.findMany({
      where: {
        Objectives: {
          Classes: {
            some: { id: classroomId },
          },
          deletedAt: null,
        },
        deletedAt: null,
      },
      include: {
        Objectives: {
          include: {
            Classes: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        Cores: true,
        Levels: true,
        Classes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Format the response
    const result = {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        levelId: classroom.levelId,
        levelName: classroom.Levels?.name,
        institutionId: classroom.institutionId,
        institutionName: classroom.Institutions?.name,
      },
      objectives: {
        total: objectives.length,
        list: objectives.map((obj) => ({
          id: obj.id,
          name: obj.name,
          position: obj.position,
          coreId: obj.coreId,
          coreName: obj.Cores?.name,
          levels: obj.ObjectiveLevels.map((ol) => ({
            id: ol.Levels.id,
            name: ol.Levels.name,
          })),
          subObjectivesCount: obj._count.SubObjectives,
          subObjectivesAssociated: obj.SubObjectives.filter((so) =>
            so.Classes.some((c) => c.id === classroomId)
          ).length,
          subObjectives: obj.SubObjectives.map((so) => ({
            id: so.id,
            name: so.name,
            position: so.position,
            isAssociatedWithClassroom: so.Classes.some((c) => c.id === classroomId),
            associatedClassrooms: so.Classes.map((c) => ({
              id: c.id,
              name: c.name,
            })),
            levels: so.Levels.map((l) => ({
              id: l.id,
              name: l.name,
            })),
          })),
          associatedClassrooms: obj.Classes.map((c) => ({
            id: c.id,
            name: c.name,
          })),
        })),
      },
      subObjectives: {
        directlyAssociated: {
          total: subObjectives.length,
          list: subObjectives.map((so) => ({
            id: so.id,
            name: so.name,
            position: so.position,
            objectiveId: so.objectiveId,
            objectiveName: so.Objectives?.name,
            isObjectiveAssociatedWithClassroom: so.Objectives?.Classes?.some(
              (c) => c.id === classroomId
            ),
            coreId: so.coreId,
            coreName: so.Cores?.name,
            levels: so.Levels.map((l) => ({
              id: l.id,
              name: l.name,
            })),
            associatedClassrooms: so.Classes.map((c) => ({
              id: c.id,
              name: c.name,
            })),
          })),
        },
        fromAssociatedObjectives: {
          total: subObjectivesFromObjectives.length,
          list: subObjectivesFromObjectives
            .filter((so) => !subObjectives.some((aso) => aso.id === so.id))
            .map((so) => ({
              id: so.id,
              name: so.name,
              position: so.position,
              objectiveId: so.objectiveId,
              objectiveName: so.Objectives?.name,
              isObjectiveAssociatedWithClassroom: so.Objectives?.Classes?.some(
                (c) => c.id === classroomId
              ),
              coreId: so.coreId,
              coreName: so.Cores?.name,
              levels: so.Levels.map((l) => ({
                id: l.id,
                name: l.name,
              })),
              associatedClassrooms: so.Classes.map((c) => ({
                id: c.id,
                name: c.name,
              })),
              isAssociatedWithClassroom: so.Classes.some((c) => c.id === classroomId),
            })),
        },
      },
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error obteniendo asociaciones:', error);
    return res.status(500).json({
      message: 'Error al obtener asociaciones',
      error: error.message,
    });
  }
}




