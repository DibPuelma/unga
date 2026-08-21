// Ejemplar few-shot curado: un par usuario→asistente que fija el estándar de
// calidad pedagógica y el formato JSON. Editable por el equipo pedagógico sin
// tocar la lógica de prompts.

export const EXEMPLAR_USER_MESSAGE = `Crea una experiencia de aprendizaje con estos datos:
- Tramo: Nivel Medio (2 a 4 años)
- Tema o interés de los niños: El fondo del mar
- Materiales disponibles: papel kraft, témpera, esponjas
- Duración aproximada: 30 minutos

Objetivos de Aprendizaje disponibles (elige entre 2 y 4 SOLO de esta lista):
- [Núcleo Exploración del entorno natural, ámbito Interacción y Comprensión del Entorno] OA 1: Manifestar interés y asombro por diversos elementos, situaciones y fenómenos del entorno natural, explorando, observando, preguntando, describiendo, agrupando, entre otros.
- [Núcleo Lenguajes artísticos, ámbito Comunicación Integral] OA 4: Expresar corporalmente sensaciones y emociones experimentando con mímica, juegos teatrales, rondas, bailes y danzas.
- [Núcleo Lenguajes artísticos, ámbito Comunicación Integral] OA 7: Representar a través del dibujo, sus ideas, intereses y experiencias, incorporando detalles a las figuras humanas y a objetos de su entorno, ubicándolos en parámetros básicos de organización espacial (arriba/abajo, dentro/fuera).
- [Núcleo Identidad y autonomía, ámbito Desarrollo Personal y Social] OA 5: Manifestar sus preferencias cuando participa o cuando solicita participar, en diversas situaciones cotidianas y juegos.`;

export const EXEMPLAR_ASSISTANT_MESSAGE = JSON.stringify({
  name: 'Un océano en la muralla',
  summary:
    'Los niños y niñas crean colectivamente un gran mural del fondo del mar estampando con esponjas, conversando sobre las criaturas marinas que conocen y eligiendo dónde ubicar cada una.',
  durationMinutes: 30,
  materials: ['Papel kraft grande', 'Témpera azul, verde y amarilla', 'Esponjas cortadas en trozos', 'Delantales o poleras viejas'],
  steps: {
    inicio: [
      'Invita a los niños y niñas a sentarse en semicírculo frente al papel kraft pegado en la muralla a su altura.',
      'Pregunta: "¿Qué creen que vive en el fondo del mar?" y acoge todas las respuestas, nombrando cada animal que mencionan.',
      'Muestra las esponjas y la témpera, e invita a descubrir qué pasa cuando la esponja toca el papel.',
    ],
    desarrollo: [
      'Ofrece a cada niño y niña una esponja y deja que elijan libremente el color con que quieren partir.',
      'Acompaña el estampado del "agua" del fondo marino, verbalizando lo que hacen: "Estás llenando de mar la parte de arriba".',
      'Cuando el mural tenga fondo, invita a cada uno a elegir qué animal marino quiere agregar y dónde ubicarlo, dibujándolo con el dedo sobre la témpera fresca o estampando formas.',
      'Favorece que decidan y expresen preferencias: "¿Tu pez irá arriba o abajo?, ¿cerca de quién?".',
    ],
    cierre: [
      'Observen juntos el mural terminado y pide que cada niño y niña muestre lo que agregó.',
      'Cierra imitando en conjunto el movimiento de los animales del mural: nadar como pez, flotar como medusa.',
      'Deja el mural exhibido en la sala y anuncia que podrán seguir agregándole criaturas durante la semana.',
    ],
  },
  oas: [
    {
      ambito: 'Interacción y Comprensión del Entorno',
      nucleo: 'Exploración del entorno natural',
      code: 'OA 1',
      text: 'Manifestar interés y asombro por diversos elementos, situaciones y fenómenos del entorno natural, explorando, observando, preguntando, describiendo, agrupando, entre otros.',
      comoSeAborda: 'Los niños y niñas exploran y describen criaturas del mar, preguntando y comentando con asombro durante la creación del mural.',
    },
    {
      ambito: 'Comunicación Integral',
      nucleo: 'Lenguajes artísticos',
      code: 'OA 7',
      text: 'Representar a través del dibujo, sus ideas, intereses y experiencias, incorporando detalles a las figuras humanas y a objetos de su entorno, ubicándolos en parámetros básicos de organización espacial (arriba/abajo, dentro/fuera).',
      comoSeAborda: 'Representan animales marinos en el mural decidiendo su ubicación espacial (arriba/abajo, cerca/lejos).',
    },
    {
      ambito: 'Desarrollo Personal y Social',
      nucleo: 'Identidad y autonomía',
      code: 'OA 5',
      text: 'Manifestar sus preferencias cuando participa o cuando solicita participar, en diversas situaciones cotidianas y juegos.',
      comoSeAborda: 'Eligen colores, criaturas y ubicaciones, expresando preferencias durante toda la experiencia.',
    },
  ],
  preguntasParaElAprendizaje: [
    '¿Qué animales del mar conoces? ¿Cuál es tu favorito?',
    '¿Qué sentiste al estampar con la esponja?',
    '¿Dónde pusiste tu animal? ¿Por qué lo pusiste ahí?',
    '¿Qué crees que comen los peces del mural?',
    '¿Qué otra criatura podríamos agregar mañana?',
  ],
  adaptaciones: [
    {
      tipo: 'menor edad',
      descripcion: 'Para los más pequeños, ofrece esponjas con mango o brochas gruesas y enfoca la experiencia solo en el estampado libre del fondo marino.',
    },
    {
      tipo: 'espacio reducido',
      descripcion: 'Reemplaza el mural por pliegos individuales sobre las mesas y une los trabajos al final formando un solo océano.',
    },
  ],
});
