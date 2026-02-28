# Seed Data Documentation

This document describes the test data created by the Prisma seed script (`prisma/seed.js`).

## Running the Seed

To populate your database with test data, run:

```bash
npx prisma db seed
```

## Users

All users share the same password: **`password123`**

### User Accounts

| Email | Password | Role | Name | Institution | Plan | Classrooms |
|-------|----------|------|------|-------------|------|------------|
| `principal@example.com` | `password123` | `principal` | Juan Principal | Jardín Infantil Ejemplo | institutional | - |
| `coordinator@example.com` | `password123` | `coordinator` | María Coordinadora | Jardín Infantil Ejemplo | institutional | - |
| `teacher1@example.com` | `password123` | `teacher` | Pedro Profesor | Jardín Infantil Ejemplo | institutional | Sala Cuna Menor A |
| `teacher2@example.com` | `password123` | `teacher` | Ana Profesora | Jardín Infantil Ejemplo | institutional | Nivel Medio Menor A |

### User Details

#### Principal
- **Email:** `principal@example.com`
- **Password:** `password123`
- **Role:** `principal`
- **Name:** Juan Principal
- **Institution:** Jardín Infantil Ejemplo
- **Plan:** institutional

#### Coordinator
- **Email:** `coordinator@example.com`
- **Password:** `password123`
- **Role:** `coordinator`
- **Name:** María Coordinadora
- **Institution:** Jardín Infantil Ejemplo
- **Plan:** institutional

#### Teacher 1
- **Email:** `teacher1@example.com`
- **Password:** `password123`
- **Role:** `teacher`
- **Name:** Pedro Profesor
- **Institution:** Jardín Infantil Ejemplo
- **Plan:** institutional
- **Main Teacher of:** Sala Cuna Menor A
- **Classrooms:** Sala Cuna Menor A

#### Teacher 2
- **Email:** `teacher2@example.com`
- **Password:** `password123`
- **Role:** `teacher`
- **Name:** Ana Profesora
- **Institution:** Jardín Infantil Ejemplo
- **Plan:** institutional
- **Main Teacher of:** Nivel Medio Menor A
- **Classrooms:** Nivel Medio Menor A

## Institutions

### Institution 1: Jardín Infantil Ejemplo
- **Name:** Jardín Infantil Ejemplo
- **Address:** Calle Ejemplo 123
- **Code:** JIE001
- **Country:** cl
- **Features:**
  - `ungaExperiences`
  - `suggestExperiencies`
  - `suggestCalendar`

### Institution 2: Jardín Infantil Test
- **Name:** Jardín Infantil Test
- **Address:** Avenida Test 456
- **Code:** JIT001
- **Country:** cl
- **Features:**
  - `ungaExperiences`

## Levels

The seed creates 6 educational levels:

1. **Sala Cuna Menor**
2. **Sala Cuna Mayor**
3. **Nivel Medio Menor**
4. **Nivel Medio Mayor**
5. **Primer Nivel Transición**
6. **Segundo Nivel Transición**

## Cores (Núcleos de Aprendizaje)

For **Jardín Infantil Ejemplo**, the following cores are created:

1. **Identidad y autonomía**
   - Type: `transversal`
   - Position: 1
   - Description: El Núcleo Identidad y Autonomía...

2. **Convivencia y ciudadanía**
   - Type: `transversal`
   - Position: 2
   - Description: El Núcleo Convivencia y Ciudadanía...

3. **Lenguaje verbal**
   - Type: `specific`
   - Position: 4
   - Description: El lenguaje verbal...

## Levels of Achievement

For **Jardín Infantil Ejemplo**, 4 levels of achievement are created:

| Name | Value | Description |
|------|-------|-------------|
| No observado | 0 | Aún no se realizan observaciones para este objetivo |
| Por lograr | 1 | El aprendizaje aún no ha sido adquirido |
| Medianamente Logrado | 2 | El niño(a) se encuentra en vías de lograr completamente el aprendizaje |
| Logrado | 3 | El niño(a) adquirió el aprendizaje |

## Classes

### Class 1: Sala Cuna Menor A
- **Name:** Sala Cuna Menor A
- **Level:** Sala Cuna Menor
- **Institution:** Jardín Infantil Ejemplo
- **Main Teacher:** Pedro Profesor (`teacher1@example.com`)

### Class 2: Nivel Medio Menor A
- **Name:** Nivel Medio Menor A
- **Level:** Nivel Medio Menor
- **Institution:** Jardín Infantil Ejemplo
- **Main Teacher:** Ana Profesora (`teacher2@example.com`)

## Students

### Student 1: Carlos González
- **Name:** Carlos González
- **RUT:** 12345678-9
- **Birth Date:** 2020-01-15
- **Class:** Sala Cuna Menor A
- **Institution:** Jardín Infantil Ejemplo

### Student 2: Sofía Martínez
- **Name:** Sofía Martínez
- **RUT:** 98765432-1
- **Birth Date:** 2020-03-20
- **Class:** Sala Cuna Menor A
- **Institution:** Jardín Infantil Ejemplo

### Student 3: Diego Rodríguez
- **Name:** Diego Rodríguez
- **RUT:** 11223344-5
- **Birth Date:** 2019-06-10
- **Class:** Nivel Medio Menor A
- **Institution:** Jardín Infantil Ejemplo

## Objectives

### Objective 1: Reconocer su imagen en el espejo
- **Name:** Reconocer su imagen en el espejo
- **Position:** 1
- **Core:** Identidad y autonomía
- **Created By:** Pedro Profesor
- **Classrooms:** Sala Cuna Menor A
- **Levels:** Sala Cuna Menor

### Objective 2: Expresar necesidades básicas
- **Name:** Expresar necesidades básicas
- **Position:** 1
- **Core:** Lenguaje verbal
- **Created By:** Pedro Profesor
- **Classrooms:** Sala Cuna Menor A
- **Levels:** Sala Cuna Menor

## SubObjectives

### SubObjective 1: Reconoce su imagen en diferentes contextos
- **Name:** Reconoce su imagen en diferentes contextos
- **Position:** 1
- **Objective:** Reconocer su imagen en el espejo
- **Core:** Identidad y autonomía
- **Institution:** Jardín Infantil Ejemplo
- **Created By:** Pedro Profesor
- **Classrooms:** Sala Cuna Menor A
- **Levels:** Sala Cuna Menor

## Activities

### Activity 1: Actividad de Espejos
- **Name:** Actividad de Espejos
- **Description:** Actividad para reconocer la imagen propia
- **Idea Origin:** Propia
- **Steps:** 
  - Paso 1
  - Paso 2
- **Materials:**
  - Espejo
  - Fotos
- **Sponsor Institution:** Jardín Infantil Ejemplo
- **Creator:** Pedro Profesor
- **Recommended Levels:** Sala Cuna Menor
- **Cores:** Identidad y autonomía
- **Objectives:** Reconocer su imagen en el espejo

## Planned Activities

### Planned Activity 1
- **Position:** 1
- **Activity:** Actividad de Espejos
- **Teacher:** Pedro Profesor
- **Classroom:** Sala Cuna Menor A
- **Institution:** Jardín Infantil Ejemplo
- **Planned Date:** Current date (when seed runs)

## Observations

### Observation 1
- **Description:** Observación de prueba
- **Teacher:** Pedro Profesor
- **Classroom:** Sala Cuna Menor A
- **Institution:** Jardín Infantil Ejemplo
- **Core:** Identidad y autonomía
- **Observed At:** Current date/time (when seed runs)
- **Students:** Carlos González

## Evaluations

### Evaluation 1
- **Objective:** Reconocer su imagen en el espejo
- **Student:** Carlos González
- **Teacher:** Pedro Profesor
- **Classroom:** Sala Cuna Menor A
- **Level:** Sala Cuna Menor
- **Institution:** Jardín Infantil Ejemplo
- **Core:** Identidad y autonomía
- **Old Level of Achievement:** No observado (0)
- **Level of Achievement:** Medianamente Logrado (2)

## Reports

### Report 1
- **Student:** Carlos González
- **Classroom:** Sala Cuna Menor A
- **Institution:** Jardín Infantil Ejemplo
- **Teacher:** Pedro Profesor
- **Summary:** Reporte de prueba
- **Updated By:** Pedro Profesor

## Attendances

Two attendance records are created for the current date:

1. **Carlos González** - `present` in Sala Cuna Menor A
2. **Sofía Martínez** - `present` in Sala Cuna Menor A

## Quick Login Reference

Use these credentials to log in:

- **Principal:** `principal@example.com` / `password123`
- **Coordinator:** `coordinator@example.com` / `password123`
- **Teacher 1:** `teacher1@example.com` / `password123`
- **Teacher 2:** `teacher2@example.com` / `password123`

## Data Summary

- **Institutions:** 2
- **Levels:** 6
- **Cores:** 3 (for Institution 1)
- **Levels of Achievement:** 4 (for Institution 1)
- **Users:** 4
- **Classes:** 2
- **Students:** 3
- **Objectives:** 2
- **SubObjectives:** 1
- **Activities:** 1
- **Planned Activities:** 1
- **Observations:** 1
- **Evaluations:** 1
- **Reports:** 1
- **Attendances:** 2

## Notes

- All passwords are hashed using bcrypt with 10 rounds
- Dates are set to the current date/time when the seed runs
- The seed creates a complete data structure with relationships between all entities
- Institution 2 is created but has no associated data (users, classes, etc.)
- All test data is associated with "Jardín Infantil Ejemplo" (Institution 1)

