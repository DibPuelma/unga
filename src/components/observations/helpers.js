import moment from "moment-timezone";

const determineDate = (observedAt, createdAt, format) => {
  if (observedAt) {
    return moment(observedAt).format(format)
  }
  return moment(createdAt).format(format)
}

export const getObservationDateTime = (observedAt, createdAt) => {
  const format = 'DD [de] MMMM [de] YYYY HH:mm';
  return determineDate(observedAt, createdAt, format)
}

export const getObservationDate = (observedAt, createdAt) => {
  const format = 'DD [de] MMMM [de] YYYY';
  return determineDate(observedAt, createdAt, format)
}