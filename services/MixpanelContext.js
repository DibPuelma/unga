import React, { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
// import mixpanel from 'mixpanel-browser';
import { UserContext } from '../src/context/UserContext';
import moment from 'moment-timezone';

export const MixpanelContext = createContext({});

export function MixpanelContextProvider({ children }) {
  const session = useSession();
  const { institution } = useContext(UserContext);
  const customIdentify = () => {
    // if (!session || !session.data || !mixpanel || typeof mixpanel.identify !== 'function') return;
    // try {
    //   const { data: { user } } = session;
    //   if (!user) return;
    //   if (!mixpanel._flags?.identify_called) {
    //     if (user?.id) {
    //       mixpanel.identify(user.id);
    //     }
    //   }
    //   const fullName = `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`;
    //   if (mixpanel.people && typeof mixpanel.people.set === 'function') {
    //     mixpanel.people.set({
    //       $email: user.email,
    //       $name: fullName,
    //       'Institution Name': institution?.name,
    //       Plan: user.plan,
    //       'Phone Number': user.phoneNumber,
    //     })
    //   }
    // } catch (error) {
    //   console.error('Error in customIdentify:', error);
    // }
  }

  const addToUserStats = (eventName) => {
    // if (!mixpanel || !mixpanel.people || typeof mixpanel.people.set !== 'function') return;
    // try {
    //   mixpanel.people.set({
    //     [`Last ${eventName}`]: moment().format(),
    //   });
    //   mixpanel.people.set_once({
    //     [`First ${eventName}`]: moment().format(),
    //   });
    //   mixpanel.people.increment(`Lifetime ${eventName}`);
    // } catch (error) {
    //   console.error('Error in addToUserStats:', error);
    // }
  }

  const trackSignUp = ({ userId, email, firstName, lastName, plan }) => {
    // mixpanel.identify(userId);
    // mixpanel.people.set_once({
    //   Email: email,
    //   Name: `${firstName} ${lastName}`,
    //   Plan: plan,
    // })
    // mixpanel.track('Sign Up');
  }

  const trackLogin = () => {
    customIdentify();
  };

  const trackLogout = () => {
    // mixpanel.track('Logout');
    // mixpanel.reset();
  };

  const trackResetPassword = (email) => {
    // customIdentify();
    // mixpanel.track('Reset Password', { email });
  };

  const trackChangeInstitution = (institutionName) => {
    // customIdentify();
    // mixpanel.people.set({
    //   'Institution Name': institutionName,
    // })
  };

  const trackCreateEvaluation = ({
    classroomName,
    coreName,
    objectiveName,
    oldLevelOfAchievementName,
    oldLevelOfAchievementValue,
    levelOfAchievementName,
    levelOfAchievementValue,
    studentName,
  }) => {
    // customIdentify();
    // mixpanel.track('Create Evaluation', {
    //   'Class Name': classroomName,
    //   'Core Name': coreName,
    //   'Objective Name': objectiveName,
    //   'Old Level Of Achievement Name': oldLevelOfAchievementName,
    //   'Old Level Of Achievement Value': oldLevelOfAchievementValue,
    //   'Level Of Achievement Name': levelOfAchievementName,
    //   'Level Of Achievement Value': levelOfAchievementValue,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Create Evaluation');
  };

  const trackCreateSubObjectiveEvaluation = ({
    classroomName,
    coreName,
    subObjectiveName,
    oldLevelOfAchievementName,
    oldLevelOfAchievementValue,
    levelOfAchievementName,
    levelOfAchievementValue,
    studentName,
  }) => {
    // customIdentify();
    // mixpanel.track('Create Sub Objective Evaluation', {
    //   'Class Name': classroomName,
    //   'Core Name': coreName,
    //   'Sub Objective Name': subObjectiveName,
    //   'Old Level Of Achievement Name': oldLevelOfAchievementName,
    //   'Old Level Of Achievement Value': oldLevelOfAchievementValue,
    //   'Level Of Achievement Name': levelOfAchievementName,
    //   'Level Of Achievement Value': levelOfAchievementValue,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Create Sub Objective Evaluation')
  };

  const trackCreatePlannedActivityEvaluation = ({
    activityPlannedDate,
    activityName,
    activityId,
    classroomName,
    coreName,
    objectiveName,
    oldLevelOfAchievementName,
    oldLevelOfAchievementValue,
    levelOfAchievementName,
    levelOfAchievementValue,
    studentName,
  }) => {
    // customIdentify();
    // mixpanel.track('Create Planned Activity Evaluation', {
    //   'Activity Planned Date': activityPlannedDate,
    //   'Activity Name': activityName,
    //   'Activity Id': activityId,
    //   'Class Name': classroomName,
    //   'Core Name': coreName,
    //   'Objective Name': objectiveName,
    //   'Old Level Of Achievement Name': oldLevelOfAchievementName,
    //   'Old Level Of Achievement Value': oldLevelOfAchievementValue,
    //   'Level Of Achievement Name': levelOfAchievementName,
    //   'Level Of Achievement Value': levelOfAchievementValue,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Planned Activity Evaluation');
  }

  const trackCreateObservation = () => {
    // customIdentify();
    // mixpanel.track('Create Observation');
    // addToUserStats('Create Observation');
  };

  const trackCreateActivity = () => {
    // customIdentify();
    // mixpanel.track('Create Activity');
    // addToUserStats('Create Activity');
  }

  const trackPlanActivity = (
    activityName,
    className,
    date,
    coresNames,
    objectivesNames,
    subObjectivesNames,
    curricularObjectivesNames,
    recommendedLevelsNames,
    amountOfMaterials,
    amountOfAssets,
  ) => {
    // customIdentify();
    // mixpanel.track('Plan Activity', {
    //   'Activity Name': activityName,
    //   'Class Name': className,
    //   'Cores': coresNames,
    //   'Objectives': objectivesNames,
    //   'Sub Objectives': subObjectivesNames,
    //   'Curricular Objectives': curricularObjectivesNames,
    //   'Suggested Level': recommendedLevelsNames,
    //   'Amount Of Materials': amountOfMaterials,
    //   'Amount Of Assets': amountOfAssets,
    //   'Day': date.format('dddd'),
    //   'Day Of The Month': date.format('D'),
    //   'Month': date.format('MMMM'),
    //   'Year': date.format('YYYY'),
    // });
    // addToUserStats('Plan Activity');
  }

  const trackPlanPublicActivity = (
    institutionName,
    activityName,
    className,
    date,
    coresNames,
    objectivesNames,
    subObjectivesNames,
    curricularObjectivesNames,
    recommendedLevelsNames,
    amountOfMaterials,
    amountOfAssets,
  ) => {
    // customIdentify();
    // mixpanel.track('Plan Public Activity', {
    //   'Sponsor Institution': institutionName,
    //   'Activity Name': activityName,
    //   'Class Name': className,
    //   'Cores': coresNames,
    //   'Objectives': objectivesNames,
    //   'Sub Objectives': subObjectivesNames,
    //   'Curricular Objectives': curricularObjectivesNames,
    //   'Suggested Level': recommendedLevelsNames,
    //   'Amount Of Materials': amountOfMaterials,
    //   'Amount Of Assets': amountOfAssets,
    //   'Day': date.format('dddd'),
    //   'Day Of The Month': date.format('D'),
    //   'Month': date.format('MMMM'),
    //   'Year': date.format('YYYY'),
    // });
    // addToUserStats('Plan Activity');
  }

  const trackEditActivityPageView = () => {
    // customIdentify();
    // mixpanel.track('Edit Activity Page View');
  }

  const trackLessonPlanPageView = (className) => {
    // customIdentify();
    // mixpanel.track('Lesson Plan Page View', {
    //   'Class Name': className,
    // });
    // addToUserStats('Plan Page View');
  }

  const trackPrintLessonPlanView = (type) => {
    // customIdentify();
    // mixpanel.track('Print Lesson Plan Page View', {
    //   'Type': type,
    // });
  }

  const trackPrintLessonPlan = (type) => {
    // customIdentify();
    // mixpanel.track('Print Lesson Plan', {
    //   'Type': type,
    // });
  }

  const trackCopyLessonPlan = ({ fromClassroom, toClassroom, totalActivities }) => {
    // customIdentify();
    // mixpanel.track('Copy Lesson Plan', {
    //   'From Classroom': fromClassroom,
    //   'To Classroom': toClassroom,
    //   'Total Activities': totalActivities,
    // });
  }

  const trackActivityIndexPageView = () => {
    // customIdentify();
    // mixpanel.track('Activity Index Page View');
    // addToUserStats('Index Page View');
  }

  const trackStudentPageView = (studentName, className) => {
    // customIdentify();
    // mixpanel.track('Student Page View', {
    //   'Class Name': className,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Student Page View');
  }

  const trackCorePageView = (coreName, className) => {
    // customIdentify();
    // mixpanel.track('Core Page View', {
    //   'Class Name': className,
    //   'Core Name': coreName,
    // });
    // addToUserStats('Core Page View');
  }

  const trackInstitutionPageView = (institutionName) => {
    // customIdentify();
    // mixpanel.track('Institution Page View', {
    //   'Institution Name': institutionName,
    // });
    // addToUserStats('Institution Page View');
  }

  const trackGenerateReport = (studentName, className) => {
    // customIdentify();
    // mixpanel.track('Generate Report', {
    //   'Class Name': className,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Generate Report');
  }

  const trackDownloadReport = (studentName, className) => {
    // customIdentify();
    // mixpanel.track('Download Report', {
    //   'Class Name': className,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Download Report');
  }

  const trackPlanningPageView = (className) => {
    // customIdentify();
    // mixpanel.track('Planning Page View', {
    //   'Class Name': className,
    // });
    // addToUserStats('Planning Page View');
  }

  const trackSaveReport = (studentName, className) => {
    // customIdentify();
    // mixpanel.track('Save Report', {
    //   'Class Name': className,
    //   'Student Name': studentName,
    // });
    // addToUserStats('Save Report');
  }

  const trackCreateObjective = ({ name, core }) => {
    // customIdentify();
    // mixpanel.track('Create Objective', {
    //   'Objective Name': name,
    //   'Core Name': core,
    // })
    // addToUserStats('Create Objective')
  }

  const trackCreateSubObjective = ({ name, core }) => {
    // customIdentify();
    // mixpanel.track('Create Sub Objective', {
    //   'Sub Objective Name': name,
    //   'Core Name': core,
    // })
    // addToUserStats('Create Sub Objective');
  }

  const trackCreateAttendance = ({ classroomName, attendanceDate }) => {
    // customIdentify();
    // mixpanel.track('Create Attendance', {
    //   'Classroom': classroomName,
    //   'Attendance Date': attendanceDate,
    // })
    // addToUserStats('Create Attendance');
  }

  const trackUpdateAttendance = ({ classroomName, attendanceDate }) => {
    // customIdentify();
    // mixpanel.track('Update Attendance', {
    //   'Classroom': classroomName,
    //   'Attendance Date': attendanceDate,
    // })
    // addToUserStats('Update Attendance');
  }

  const trackOpenSuggestActivity = () => {
    // customIdentify();
    // mixpanel.track('Open Suggest Activity')
    // addToUserStats('Open Suggest Activity');
  }

  const trackRequestSuggestActivity = () => {
    // customIdentify();
    // mixpanel.track('Request Suggest Activity')
    // addToUserStats('Request Suggest Activity');
  }

  const trackWaitedForSuggestedActivity = () => {
    // customIdentify();
    // mixpanel.track('Waited For Suggested Activity')
    // addToUserStats('Waited For Suggested Activity');
  }

  const trackEditSuggestedActivity = () => {
    // customIdentify();
    // mixpanel.track('Edit Suggested Activity')
    // addToUserStats('Edit Suggested Activity');
  }

  const trackCreateSuggestedActivity = () => {
    // customIdentify();
    // mixpanel.track('Create Suggested Activity')
    // addToUserStats('Create Suggested Activity');
  }

  const trackCreateInstitution = (institutionName) => {
    // customIdentify();
    // mixpanel.track('Create Institution', {
    //   'Institution Name': institutionName,
    // })
  };

  const trackCreatePlannedActivityObservation = ({
    classroom,
    core,
    date,
    activity,
  }) => {
    // customIdentify();
    // mixpanel.track('Create Planned Activity Observation', {
    //   'Classroom': classroom,
    //   'Core Name': core,
    //   'Date': date,
    //   'Activity Name': activity,
    // });
  }

  const trackPayIndividualPlanPageView = ({ daysUntilPayment }) => {
    // customIdentify();
    // mixpanel.track('Pay Individual Plan Page View', {
    //   'Days Until Payment': daysUntilPayment,
    // })
  }

  const trackMassCreateObjectives = () => {
    // customIdentify();
    // mixpanel.track('Mass Create Objectives')
  }

  const trackUploadCreateStudents = () => {
    // customIdentify();
    // mixpanel.track('Upload Create Students')
  }

  const trackCreateStudent = ({
    firstName,
    lastName,
    birthDate,
    rut,
  }) => {
    // customIdentify();
    // mixpanel.track('Create Student', {
    //   'First Name': firstName,
    //   'Last Name': lastName,
    //   'Birth Date': birthDate,
    //   'Rut': rut,
    // })
  }

  const trackOnboardingStep = (step) => {
    // customIdentify();
    // mixpanel.track('Onboarding Step', {
    //   'Step': step,
    // })
  }

  const trackOpenSuggestedWeek = (startDate) => {
    // customIdentify();
    // mixpanel.track('Open Suggested Week', { 'Start Date': startDate })
  }

  const trackUseSuggestedWeek = (startDate) => {
    // customIdentify();
    // addToUserStats('Use Suggested Week');
    // mixpanel.track('Use Suggested Week', { 'Start Date': startDate })
  }

  const trackActionInSuggestedWeek = (startDate, action) => {
    // customIdentify();
    // mixpanel.track('Action In Suggested Week', {
    //   'Start Date': startDate,
    //   'Action': action,
    // })
  }

  const trackOnboardingCreateClassrooms = () => {
    // customIdentify();
    // mixpanel.track('Onboarding Create Classrooms')
  }
  
  const trackPurchasePlan = (plan) => {
    // customIdentify();
    // mixpanel.track('Purchase Plan', {
    //   'Plan': plan,
    // })
  }
  
  const trackSelectPlan = (plan) => {
    // customIdentify();
    // mixpanel.track('Select Plan', {
    //   'Plan': plan,
    // })
  }

  const trackOnboardingOpenLibraryModal = () => {
    // customIdentify();
    // mixpanel.track('Onboarding Open Library Modal')
  }

  const trackRemoveTeacherFromClassroom = ({ classroomId, teacherId, teacherName }) => {
    // customIdentify();
    // mixpanel.track('Remove Teacher From Classroom', {
    //   'Classroom Id': classroomId,
    //   'Teacher Id': teacherId,
    //   'Teacher Name': teacherName,
    // })
  }

  const trackDuplicatePublicActivity = () => {
    // customIdentify();
    // mixpanel.track('Duplicate Public Activity')
  }

  const trackDuplicateCommunityActivity = () => {
    // customIdentify();
    // mixpanel.track('Duplicate Community Activity')
  }

  const trackViewActivity = ({ name, isPublic, isFromCommunity }) => {
    // customIdentify();
    // mixpanel.track('View Activity', {
    //   'Activity Name': name,
    //   'Is Public': isPublic,
    //   'Is From Community': isFromCommunity,
    // })
  }

  const trackReviewActivity = ({ name, isPublic, isFromCommunity }) => {
    // customIdentify();
    // mixpanel.track('Review Activity', {
    //   'Activity Name': name,
    //   'Is Public': isPublic,
    //   'Is From Community': isFromCommunity,
    // })
  }

  return (
    <MixpanelContext.Provider value={{
      trackLogin,
      trackLogout,
      trackResetPassword,
      trackCreateEvaluation,
      trackCreateSubObjectiveEvaluation,
      trackCreatePlannedActivityEvaluation,
      trackCreateObjective,
      trackCreateSubObjective,
      trackCreateObservation,
      trackStudentPageView,
      trackCorePageView,
      trackInstitutionPageView,
      trackPlanningPageView,
      trackGenerateReport,
      trackDownloadReport,
      trackPlanActivity,
      trackPlanPublicActivity,
      trackCreateActivity,
      trackEditActivityPageView,
      trackLessonPlanPageView,
      trackPrintLessonPlanView,
      trackPrintLessonPlan,
      trackCopyLessonPlan,
      trackActivityIndexPageView,
      trackSaveReport,
      trackCreateAttendance,
      trackUpdateAttendance,
      trackOpenSuggestActivity,
      trackRequestSuggestActivity,
      trackWaitedForSuggestedActivity,
      trackEditSuggestedActivity,
      trackCreateSuggestedActivity,
      trackSignUp,
      trackChangeInstitution,
      trackCreateInstitution,
      trackCreatePlannedActivityObservation,
      trackPayIndividualPlanPageView,
      trackMassCreateObjectives,
      trackUploadCreateStudents,
      trackCreateStudent,
      trackOnboardingStep,
      trackOpenSuggestedWeek,
      trackUseSuggestedWeek,
      trackActionInSuggestedWeek,
      trackPurchasePlan,
      trackSelectPlan,
      trackOnboardingCreateClassrooms,
      trackOnboardingOpenLibraryModal,
      trackRemoveTeacherFromClassroom,
      trackDuplicatePublicActivity,
      trackDuplicateCommunityActivity,
      trackViewActivity,
      trackReviewActivity,
    }}>
      {children}
    </MixpanelContext.Provider>
  );
}
