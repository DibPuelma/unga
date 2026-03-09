import { authOptions } from "pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import prisma from "lib/prisma";
import { validateSuperAdmin } from "../upload/_utils";

export default async function handler(req, res) {
  if (req.method !== "DELETE" && req.method !== "PATCH" && req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!validateSuperAdmin(session)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  const { institutionId } = req.query;
  const body = req.body || {};
  const bodyStudentIds = Array.isArray(body.studentIds) ? body.studentIds : [];
  const queryCsv = typeof req.query.studentIdsCsv === "string" ? req.query.studentIdsCsv : "";
  const queryStudentIds = queryCsv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const studentIds = bodyStudentIds.length > 0 ? bodyStudentIds : queryStudentIds;
  const classroomId = body.classroomId;
  const isDeleteAction = req.method === "DELETE" || (req.method === "POST" && body.action === "delete");

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: "Debes enviar al menos un estudiante." });
  }

  try {
    const institution = await prisma.institutions.findUnique({
      where: { id: institutionId },
      select: { id: true },
    });

    if (!institution) {
      return res.status(404).json({ message: "Institución no encontrada" });
    }

    const validStudents = await prisma.students.findMany({
      where: {
        id: { in: studentIds },
        institutionId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (validStudents.length === 0) {
      return res.status(404).json({ message: "No se encontraron estudiantes válidos para actualizar." });
    }

    const validStudentIds = validStudents.map((student) => student.id);

    if (isDeleteAction) {
      const deletedAt = new Date();
      const result = await prisma.students.updateMany({
        where: {
          id: { in: validStudentIds },
          institutionId,
          deletedAt: null,
        },
        data: { deletedAt },
      });

      return res.status(200).json({
        message: `${result.count} estudiante(s) eliminados exitosamente.`,
      });
    }

    if (!classroomId) {
      return res.status(400).json({ message: "Debes seleccionar una sala destino." });
    }

    const classroom = await prisma.classes.findFirst({
      where: {
        id: classroomId,
        institutionId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!classroom) {
      return res.status(404).json({ message: "Sala no encontrada para esta institución." });
    }

    const result = await prisma.students.updateMany({
      where: {
        id: { in: validStudentIds },
        institutionId,
        deletedAt: null,
      },
      data: {
        classId: classroomId,
      },
    });

    return res.status(200).json({
      message: `${result.count} estudiante(s) actualizados exitosamente.`,
    });
  } catch (error) {
    console.error("Error en operación masiva de estudiantes:", error);
    return res.status(500).json({
      message: "Error al procesar estudiantes",
      error: error.message,
    });
  }
}
