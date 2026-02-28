import { decrypt } from "./crypto";

export default class LessonPlanService {
  constructor(context) {
    this.context = context;
  }

  getParams() {
    const {
      params: { classroomId: paramsClassroomId },
      query: { startDate: queryStartDate, endDate: queryEndDate, keyIV, keyContent, plannedActivityId },
    } = this.context;
    const processedParams = {
      startDate: queryStartDate,
      endDate: queryEndDate,
      classroomId: paramsClassroomId,
      plannedActivityId: plannedActivityId,
      institutionId: null,
      fontSizeMultiplier: null,
      uniqueFontSize: null,
      headers: null,
      isPrinting: Boolean(keyIV && keyContent),
    }
    if (processedParams.isPrinting) {
      const decryptedParams = JSON.parse(decrypt({ iv: keyIV, content: keyContent }));
      processedParams.startDate = decryptedParams.startDate;
      processedParams.endDate = decryptedParams.endDate;
      processedParams.classroomId = decryptedParams.classroomId;
      processedParams.institutionId = decryptedParams.institutionId;
      processedParams.headers = decryptedParams.headers?.split(',');
      processedParams.fontSizeMultiplier = parseFloat(decryptedParams.fontSizeMultiplier);
      processedParams.uniqueFontSize = decryptedParams.uniqueFontSize === 'true';
      processedParams.plannedActivityId = decryptedParams.plannedActivityId;
    }

    return processedParams;
  }
}