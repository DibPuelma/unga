import React from 'react';
import {
  LinearProgress,
} from '@mui/material';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { isAuthorized } from 'services/Authorization';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const {
    user: {
      institution,
      institutionId,
      class:
      _class,
      role,
      classrooms,
      plan,
      selectedFreeTrialPlan,
      deletedAt,
    } } = await getServerSession(context.req, context.res, authOptions);

  if (deletedAt) {
    return {
      redirect: {
        permanent: false,
        destination: '/not-authorized'
      }
    }
  }

  if (role === 'superAdmin') {
    return {
      redirect: {
        permanent: false,
        destination: '/super-admin/pmf-answers',
      }
    }
  }

  if (!role) {
    return {
      redirect: {
        permanent: false,
        destination: '/users/select-role'
      }
    }
  }

  if (role === 'parent') {
    if ((plan === 'trial' && !selectedFreeTrialPlan)) {
      return {
        redirect: {
          permanent: false,
          destination: '/users/onboarding/parents'
        }
      }
    }
    return {
      redirect: {
        permanent: true,
        destination: '/parents',
      }
    }
  }

  if (role === 'teacher' || role === 'coordinator' || role === 'principal') {
    const hasInstitution = institution?.id || institutionId;
    
    // Principals and coordinators don't require classrooms, only institution
    if (role === 'principal' || role === 'coordinator') {
      if (!hasInstitution || (plan === 'trial' && !selectedFreeTrialPlan)) {
        return {
          redirect: {
            permanent: false,
            destination: `/users/onboarding`
          }
        }
      }
      // Redirect to institution page or first available classroom
      return {
        redirect: {
          permanent: false,
          destination: hasInstitution ? `/institutions/${institution?.id || institutionId}` : `/users/onboarding`
        }
      }
    }
    
    // Teachers require both institution and classrooms
    // Only redirect to onboarding if missing institution/classrooms OR if on trial without selected plan
    // Don't redirect to onboarding just because plan is null/undefined - they can still access their classroom
    console.log('classrooms', classrooms);
    console.log('hasInstitution', hasInstitution);
    console.log('plan', plan);
    console.log('selectedFreeTrialPlan', selectedFreeTrialPlan);
    if (!hasInstitution || !classrooms || classrooms.length === 0) {
      return {
        redirect: {
          permanent: false,
          destination: `/users/onboarding`
        }
      }
    }
    
    // If on trial without selected plan, redirect to onboarding to select plan
    if (plan === 'trial' && !selectedFreeTrialPlan) {
      return {
        redirect: {
          permanent: false,
          destination: `/users/onboarding`
        }
      }
    }

    // Teacher has institution and classrooms - redirect to classroom
    return {
      redirect: {
        permanent: false,
        destination: `/classes/${_class?.id || classrooms[0]}`
      }
    }
  }

  return {
    redirect: {
      permanent: false,
      destination: "/404"
    }
  }
}

export default function Index() {
  return <LinearProgress />
}

Index.auth = true