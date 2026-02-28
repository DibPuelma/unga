import { ATTENDANCE_TYPES } from "db/attendance";
import moment from "moment-timezone";
import { enumerateWorkDaysBetweenDates } from "src/helpers/dates";

export const getAttendanceAnalyticsByDateAndMonth = (attendaces, startDate, endDate) => {
  const allDates = enumerateWorkDaysBetweenDates(moment(startDate), moment(endDate));
  const attendanceByDate = getAttendanceByDate(attendaces);
  const analyticsByDate = getAnalyticsByDate(attendanceByDate, allDates);
  const analyticsByMonth = getAnalyticsByMonth(analyticsByDate, allDates)
  return {
    analyticsByDate,
    analyticsByMonth,
  }
}

const getAttendanceByDate = (attendaces) => {
  return attendaces.reduce((acc, attendance) => {
    const attendanceDate = attendance.attendanceDate;
    if (!acc[attendanceDate]) acc[attendanceDate] = [];
    acc[attendanceDate].push(attendance);

    return acc;
  }, {})
}

const getAnalyticsByDate = (attendanceByDate, allDates) => {
  const analyticsByDate = {};
  allDates.forEach((date) => {
    if (!attendanceByDate[date]) {
      analyticsByDate[date] = {};
      analyticsByDate[date].notRegisteredPercentage = 1;
      return;
    }
    analyticsByDate[date] = {};

    attendanceByDate[date].forEach((attendance, j) => {
      const type = attendance.attendanceType;

      if (!analyticsByDate[date][`${type}Count`]) analyticsByDate[date][`${type}Count`] = 0;
      analyticsByDate[date][`${type}Count`] += 1;
      if (j === attendanceByDate[date].length - 1) {
        let registeredPercentage = 0;
        ATTENDANCE_TYPES.forEach((attendanceType) => {
          if (!analyticsByDate[date][`${attendanceType}Count`]) return;

          analyticsByDate[date][`${attendanceType}Percentage`] = (analyticsByDate[date][`${attendanceType}Count`] / (attendanceByDate[date].length));
          registeredPercentage += analyticsByDate[date][`${attendanceType}Percentage`];
        })

        analyticsByDate[date].notRegisteredPercentage = 1 - registeredPercentage
      }
    });
  });

  return analyticsByDate;
}

const getAnalyticsByMonth = (analyticsByDate, allDates) => {
  let oldMonth = null;
  let workDaysInMonth = 0;
  return allDates.reduce((acc, date, i) => {
    const month = date.slice(5, 7);
    if (!acc[month]) acc[month] = {};

    ATTENDANCE_TYPES.forEach((attendanceType) => {
      if (!acc[month][`${attendanceType}PercentageSum`]) acc[month][`${attendanceType}PercentageSum`] = 0;

      if (analyticsByDate[date] && analyticsByDate[date][`${attendanceType}Percentage`]) {
        acc[month][`${attendanceType}PercentageSum`] += analyticsByDate[date][`${attendanceType}Percentage`];
      }
    })

    if ((oldMonth && (oldMonth !== month || i === allDates.length - 1))) {
      if (i === allDates.length - 1) workDaysInMonth += 1;
      ATTENDANCE_TYPES.forEach((attendanceType) => {
        acc[oldMonth][`${attendanceType}Percentage`] = acc[oldMonth][`${attendanceType}PercentageSum`] / workDaysInMonth;
      })
      workDaysInMonth = 0;
    }

    workDaysInMonth += 1;
    oldMonth = date.slice(5, 7);
    return acc;
  }, {})
}