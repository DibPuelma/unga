import prisma from './prisma';
import moment from 'moment-timezone';

export const createBaseCoresForInstitution = async (institutionId, countryCode = 'cl') => {
  const cores = countryCode === 'mx'
    ? [
        { name: 'Inclusión', institutionId, position: 1, type: 'transversal' },
        { name: 'Pensamiento Crítico', institutionId, position: 2, type: 'transversal' },
        { name: 'Interculturalidad Crítica', institutionId, position: 3, type: 'transversal' },
        { name: 'Igualdad de Género', institutionId, position: 4, type: 'transversal' },
        { name: 'Vida Saludable', institutionId, position: 5, type: 'transversal' },
        { name: 'Apropiación de las culturas a través de la lectura y escritura', institutionId, position: 6, type: 'transversal' },
        { name: 'Artes y experiencias estéticas', institutionId, position: 7, type: 'transversal' },
      ]
    : [
          {
            name: 'Identidad y autonomía',
            description: 'El Núcleo Identidad y Autonomía, refiere al proceso de construcción gradual de una conciencia de sí mismo que realiza la niña y el niño, como individuo singular diferente de los otros, en forma paralela y complementaria con la adquisición progresiva de independencia y autovalencia en los distintos planos de su actuar',
          institutionId,
            position: 1,
            type: 'transversal',
          },
          {
            name: 'Convivencia y ciudadanía',
            description: 'El Núcleo Convivencia y Ciudadanía, está referido al conjunto de actitudes, conocimientos y habilidades sociales y emocionales, que permiten al niño y la niña, convivir pacíficamente con otros, tomar decisiones que favorecen el bien común, y desarrollar progresivamente un sentido de pertenencia a una comunidad cada vez más amplia, compartiendo valores y responsabilidades sobre la base de los derechos humanos. Este núcleo busca promover el ejercicio de una ciudadanía activa, a través de la participación, la colaboración y el respeto',
          institutionId,
            position: 2,
            type: 'transversal',
          },
          {
            name: 'Corporalidad y movimiento',
            description: 'Este Núcleo busca articular equilibradamente los distintos factores neurológicos, fisiológicos, psicológicos y sociales que permiten el desarrollo armónico de la corporalidad y el movimiento. A partir del movimiento las niñas y los niños adquieren conciencia de su propio cuerpo, desarrollan grados crecientes de autonomía, fortalecen su identidad, descubren su entorno, expanden sus procesos de pensamiento, resuelven problemas prácticos, establecen relaciones de orientación espacio temporal y potencian su expresión',
          institutionId,
            position: 3,
            type: 'transversal',
          },
          {
            name: 'Lenguaje verbal',
            description: 'El lenguaje verbal, es uno de los recursos más significativos mediante los cuales los párvulos se comunican. Es un instrumento imprescindible para el desarrollo del pensamiento del niño o niña especialmente en su dimensión oral. A través del habla, no sólo expresan sus sensaciones, necesidades, emociones, opiniones y vivencias, sino que, además, organizan y controlan su comportamiento e interpretan y construyen el mundo que habitan',
          institutionId,
            position: 4,
            type: 'specific',
          },
          {
            name: 'Lenguajes artísticos',
            description: 'El núcleo de Lenguajes Artísticos articula objetivos de aprendizaje que buscan promover la capacidad para expresar la imaginación y las vivencias propias, representar y recrear la realidad mediante diversas elaboraciones originales que hacen los niños y las niñas, y por otra parte, apreciar y disfrutar manifestaciones estéticas presentes en la naturaleza y la cultura. Integra a todos aquellos medios de expresión que favorecen la sensibilidad estética, la apreciación y la manifestación creativa, como son lo plástico visual, lo corporal y musical, entre otros',
          institutionId,
            position: 5,
            type: 'specific',
          },
          {
            name: 'Exploración del entorno natural',
            description: 'Este núcleo hace referencia al desarrollo de habilidades, actitudes y conocimientos relacionados con el descubrimiento activo, valoración, cuidado del entorno natural, y al avance progresivo de los párvulos en un proceso de alfabetización científica inicial. Las niñas y los niños se sienten cada vez más partícipes del entorno natural, en tanto tienen frecuentes oportunidades de convivir con él. Así, mediante actividades de exploración espontáneas, observan, se asombran, hacen preguntas, formulan interpretaciones, sobre diversos elementos y seres vivos que encuentran, como el agua, la luz, los animales, la trayectoria seguida por el sol; y sobre fenómenos como la lluvia, los sismos, y otros',
          institutionId,
            position: 6,
            type: 'specific',
          },
          {
            name: 'Comprensión del entorno sociocultural',
            description: 'Este núcleo refiere al conjunto de habilidades, actitudes y conocimientos que se espera aprendan niñas y niños acerca de los grupos humanos que conforman su entorno social y cultural, sus formas de vida y organizaciones; así como también las creaciones, obras tangibles e intangibles y acontecimientos relevantes de las comunidades. Los objetivos de aprendizaje que se favorecen en este núcleo, promueven que los párvulos pongan en juego sus capacidades para explorar, conocer y apreciar el entorno sociocultural inmediato y más lejano, tanto desde una perspectiva espacial como temporal',
          institutionId,
            position: 7,
            type: 'specific',
          },
          {
            name: 'Pensamiento matemático',
            description: 'Este núcleo refiere a los diferentes procesos a través de los cuales los niños y niñas tratan de interpretar y explicar los diversos elementos y situaciones del entorno, tales como ubicación en el espacio-tiempo, relaciones de orden, comparación, clasificación, seriación, identificación de patrones. A esto se agrega la construcción de la noción de número y el uso inicial de la función ordenadora y cuantificadora del mismo en un ámbito numérico pertinente a los párvulos',
          institutionId,
            position: 8,
            type: 'specific',
          },
      ];

  await prisma.cores.createMany({
    data: cores,
  });
};

export const getCore = async (coreId) => {
  const core = await prisma.cores.findUnique({
    where: { id: coreId },
  });

  return core;
}

// Complex query functions - simplified versions
export const getCoresWithLevelsOfAchievementByObjectiveAndSubObjective = async (institutionId, classroomId, startDate, endDate) => {
  // Fetch students for the classroom to populate studentsLevelOfAchievement
  const students = await prisma.students.findMany({
    where: {
      classId: classroomId,
      deactivatedAt: null,
      deletedAt: null,
    },
  });

  // Fetch default level of achievement
  const defaultLevel = await prisma.levelsOfAchievement.findFirst({
    where: {
      institutionId,
      value: 0,
    },
  });

  const cores = await prisma.cores.findMany({
    where: { institutionId },
    include: {
      Objectives: {
        where: {
          deletedAt: null,
          Classes: {
            some: { id: classroomId },
          },
        },
        include: {
          SubObjectives: {
            where: {
              deletedAt: null,
              Classes: {
                some: { id: classroomId },
              },
            },
            include: {
              Cores: true,
              Objectives: {
                include: { ObjectiveLevels: { include: { Levels: true } } },
              },
              SubObjectivesEvaluations: {
                where: {
                  studentId: { in: students.map((s) => s.id) },
                  createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                  },
                },
                include: {
                  Students: true,
                  LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement: true,
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          Evaluations: {
            where: {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
            include: {
              Students: true,
              LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
            },
          },
                  },
      },
    },
  });

  // Return Prisma results with proper structure, transforming to lowercase for backward compatibility
  return JSON.parse(JSON.stringify(cores.map((core) => ({
    ...core,
    objectives: core.Objectives.map((obj) => {
      // Transform sub-objectives to include studentsLevelOfAchievement and parent objective
      // Sort sub-objectives by position (null positions go to the end)
      const sortedSubObjectives = [...obj.SubObjectives].sort((a, b) => {
        if (a.position === null && b.position === null) return 0;
        if (a.position === null) return 1;
        if (b.position === null) return -1;
        return (a.position || 0) - (b.position || 0);
      });

      const transformedSubObjectives = sortedSubObjectives.map((subObj) => {
        const studentsLevelOfAchievement = students.map((student) => {
          const evaluation = subObj.SubObjectivesEvaluations.find((e) => e.studentId === student.id);
          return {
            student: {
              ...student,
              fullName: `${student.firstName} ${student.lastName}`,
            },
            levelOfAchievement: evaluation
              ? evaluation.LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement
              : defaultLevel || null,
            evaluatedAt: evaluation?.createdAt || null,
          };
        });

        return {
          ...subObj,
          objective: subObj.Objectives, // Include parent objective relation
          core: subObj.Cores,
          studentsLevelOfAchievement,
          evaluations: subObj.SubObjectivesEvaluations.map(e => ({
            ...e,
            student: e.Students,
            levelOfAchievement: e.LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement,
          })),
        };
      });

      // Create studentsLevelOfAchievement for all students, matching sub-objectives pattern
      const studentsLevelOfAchievement = students.map((student) => {
        const evaluation = obj.Evaluations.find((e) => e.studentId === student.id);
        return {
          student: {
            ...student,
            fullName: `${student.firstName} ${student.lastName}`,
          },
          levelOfAchievement: evaluation
            ? evaluation.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement
            : defaultLevel || null,
          evaluatedAt: evaluation?.createdAt || null,
        };
      });

      return {
        ...obj,
        core: core,
        subObjectives: transformedSubObjectives || [], // Ensure it's always an array
        studentsLevelOfAchievement,
        evaluations: obj.Evaluations.map(e => ({
          ...e,
          student: e.Students,
          levelOfAchievement: e.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement,
        })),
      };
    }),
  }))));
}

export const getCoreWithLevelsOfAchievementByObjectiveAndSubObjective = async (coreId, institutionId, classroomId, startDate, endDate) => {
  const coresResult = await getCoresWithLevelsOfAchievementByObjectiveAndSubObjective(institutionId, classroomId, startDate, endDate);
  return coresResult.find((c) => c.id === coreId) || null;
}

export const getCoresWithLevelsOfAchievementByStudent = async ({ institutionId, studentId, startDate, endDate }) => {
  const cores = await prisma.cores.findMany({
    where: { institutionId },
    include: {
      Objectives: {
        where: {
          deletedAt: null,
          Classes: {
            some: {
              Students: {
                some: { id: studentId },
              },
            },
          },
        },
        include: {
          SubObjectives: {
            where: { deletedAt: null },
          },
          Evaluations: {
            where: {
              studentId,
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
            },
          },
        },
      },
    },
  });

  // Return Prisma results, transforming to lowercase for backward compatibility
  return JSON.parse(JSON.stringify(cores.map((core) => {
    return {
      ...core,
      objectives: core.Objectives.map((obj) => {
        const latestEval = obj.Evaluations[0];
        return {
          ...obj,
          core: core,
          evaluatedAt: latestEval?.createdAt || null,
          levelOfAchievement: latestEval?.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement || null,
          subObjectives: obj.SubObjectives,
          evaluations: obj.Evaluations.map(e => ({
            ...e,
            student: e.Students,
            levelOfAchievement: e.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement,
          })),
        };
      }),
    };
  })));
}

export const getCores = async (institutionId) => {
  const cores = await prisma.cores.findMany({
    where: { institutionId },
    orderBy: { position: 'asc' },
  });

  return cores;
}

export const deleteCore = async (coreId) => {
  // Get all objectives for this core
  const objectives = await prisma.objectives.findMany({
    where: { coreId, deletedAt: null },
  });

  const objectiveIds = objectives.map((obj) => obj.id);

  // Soft delete all sub-objectives associated with this core
  // (both those associated with objectives and those directly associated with the core)
  await prisma.subObjectives.updateMany({
    where: {
      coreId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  // Soft delete all objectives for this core
  await prisma.objectives.updateMany({
    where: {
      coreId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  // Hard delete the core (since Core model doesn't have deletedAt)
  const deletedCore = await prisma.cores.delete({
    where: { id: coreId },
  });

  return deletedCore;
}

export const getPublicCores = async () => {
  // Assuming public institution ID is known or can be found
  // For now, return empty or implement based on your needs
  const cores = await prisma.cores.findMany({
    take: 100,
  });

  return cores;
}

export const getInstitutionCoresWithObjectives = async (institutionId) => {
  const cores = await prisma.cores.findMany({
    where: { institutionId },
    include: {
      Objectives: {
        where: { deletedAt: null },
        include: {
          ObjectiveLevels: {
            include: { Levels: true },
          },
          Classes: true,
          CurricularObjectives: {
            include: {
              Levels: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      CurricularObjectives: {
        include: {
          Levels: true,
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  return JSON.parse(JSON.stringify(cores.map((core) => {
    return {
      ...core,
      curricularObjectives: core.CurricularObjectives.map((co) => ({
        ...co,
        levels: co.Levels || [],
      })),
      objectives: core.Objectives.map((obj) => ({
        ...obj,
        type: core.type,
        levels: obj.ObjectiveLevels.map(ol => ol.Levels),
        core: core,
        curricularObjective: obj.CurricularObjectives ? {
          ...obj.CurricularObjectives,
          levels: obj.CurricularObjectives.Levels || [],
        } : null,
        classrooms: obj.Classes,
      })),
    };
  })));
}

export const getAllCoresWithAdvancement = async (
  institutionId,
  classroomId,
  startDate = moment().startOf('year').format('YYYY-MM-DD'),
  endDate = moment().add(1, 'day').format('YYYY-MM-DD'),
) => {
  const cores = await prisma.cores.findMany({
    where: { institutionId },
    include: {
      Objectives: {
        where: {
          deletedAt: null,
          Classes: {
            some: { id: classroomId },
          },
        },
        include: {
          Evaluations: {
            where: {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
            include: {
              Students: true,
              LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
            },
          },
        },
      },
    },
  });

  const students = await prisma.students.findMany({
    where: {
      classId: classroomId,
      deactivatedAt: null,
      deletedAt: null,
    },
  });

  const levelsOfAchievement = await prisma.levelsOfAchievement.findMany({
    where: { institutionId },
  });

  const maxValue = Math.max(...levelsOfAchievement.map((l) => l.value), 0);

  const transformedCores = cores.map((core) => {
    const objectives = core.Objectives;
    const possibleEvaluations = objectives.length * students.length;
    
    // Calculate advancement data
    const advancementData = objectives.map((obj) =>
      students.map((student) => {
        const evaluation = obj.Evaluations.find((e) => e.studentId === student.id);
        return evaluation ? evaluation.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement.value : 0;
      })
    );

    const totalEvaluations = advancementData.flat().filter((v) => v > 0).length;
    const totalValue = advancementData.flat().reduce((sum, val) => sum + val, 0);

    const advancement =
      totalEvaluations > 0 ? totalValue / (totalEvaluations * maxValue) : 0;
    const completeness =
      possibleEvaluations > 0 ? totalEvaluations / possibleEvaluations : 0;

    return {
      ...core,
      advancement,
      possibleEvaluations,
      totalEvaluations,
      completeness,
    };
  });

  return JSON.parse(JSON.stringify(transformedCores));
}

export const getCoresWithAdvancementForStudentAndMonth = async (institutionId, studentId, month) => {
  const endOfMonth = moment().startOf('year').add(month, 'months').endOf('month');

  return await getCoresWithLevelsOfAchievementByStudent({
    institutionId,
    studentId,
    endDate: endOfMonth.format('YYYY-MM-DD'),
  });
}

export const getCoresWithAdvancementForStudentAndDates = async ({ institutionId, studentId, startDate, endDate }) => {
  return await getCoresWithLevelsOfAchievementByStudent({
    institutionId,
    studentId,
    startDate,
    endDate,
  });
}

export const getObjectivesTree = async (institutionId) => {
  const cores = await prisma.cores.findMany({
    where: { institutionId },
    include: {
      CurricularObjectives: {
        include: {
          Levels: true,
        },
        orderBy: { name: 'asc' },
      },
      Objectives: {
        where: { deletedAt: null },
        include: {
          SubObjectives: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
          },
          CurricularObjectives: true,
          Classes: true,
          ObjectiveLevels: {
            include: { Levels: true },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { position: 'asc' },
  });

  return cores.map((core) => {
    const objectivesByOA = {};
    const unlinkedObjectives = [];

    for (const obj of core.Objectives) {
      const mapped = {
        id: obj.id,
        name: obj.name,
        position: obj.position,
        coreId: obj.coreId,
        curricularObjectiveId: obj.curricularObjectiveId,
        classrooms: obj.Classes,
        levels: obj.ObjectiveLevels?.map((ol) => ol.Levels) || [],
        subObjectives: obj.SubObjectives.map((so) => ({
          id: so.id,
          name: so.name,
          position: so.position,
          objectiveId: so.objectiveId,
          coreId: so.coreId,
          curricularObjectiveId: so.curricularObjectiveId,
        })),
      };

      if (obj.curricularObjectiveId) {
        if (!objectivesByOA[obj.curricularObjectiveId]) {
          objectivesByOA[obj.curricularObjectiveId] = [];
        }
        objectivesByOA[obj.curricularObjectiveId].push(mapped);
      } else {
        unlinkedObjectives.push(mapped);
      }
    }

    const curricularObjectives = core.CurricularObjectives.map((co) => ({
      id: co.id,
      name: co.name,
      coreId: co.coreId,
      levels: co.Levels || [],
      objectives: objectivesByOA[co.id] || [],
    }));

    return {
      id: core.id,
      name: core.name,
      description: core.description,
      position: core.position,
      type: core.type,
      curricularObjectives,
      unlinkedObjectives,
    };
  });
}
