# Teacher Redirect Flows Summary

## Overview
This document outlines all the different redirect flows that exist for teachers in the application.

## 1. Root Path (`/`) Redirects (pages/index.js)

### Flow Entry Point
When a teacher logs in or navigates to `/`, the `getServerSideProps` function in `pages/index.js` determines where to redirect them.

### Conditions Checked (in order):

#### A. Deleted User
- **Condition**: `deletedAt` exists
- **Redirect**: `/not-authorized`

#### B. Super Admin
- **Condition**: `role === 'superAdmin'`
- **Redirect**: `/super-admin/pmf-answers`

#### C. No Role
- **Condition**: `!role`
- **Redirect**: `/users/select-role`

#### D. Teacher Role (lines 70-120)

**For Teachers specifically:**

1. **Missing Institution OR Missing Classrooms**
   - **Condition**: `!hasInstitution || !classrooms || classrooms.length === 0`
   - **Redirect**: `/users/onboarding`
   - **Reason**: Teacher needs to set up institution and/or create classrooms

2. **On Trial Without Selected Plan**
   - **Condition**: `plan === 'trial' && !selectedFreeTrialPlan`
   - **Redirect**: `/users/onboarding`
   - **Reason**: Teacher needs to select a plan to continue

3. **Has Institution AND Classrooms AND (plan is not 'trial' OR selectedFreeTrialPlan exists OR plan is null/undefined)**
   - **Redirect**: `/classes/${_class?.id || classrooms[0]}`
   - **Reason**: Teacher is fully set up, redirect to their classroom

**Note**: As of the latest fix, teachers with `plan = null/undefined` but with institution and classrooms will be redirected to their classroom (not onboarding).

---

## 2. Authorization Middleware (`isAuthorized` in services/Authorization.js)

### Flow Entry Point
Called on every page that uses `isAuthorized` in `getServerSideProps`.

### Conditions Checked (in order):

#### A. No Session
- **Condition**: `!session`
- **Redirect**: `/auth/login`

#### B. Invalid Plan
- **Condition**: `plan != null && !authorizedPlans.includes(plan)`
- **Redirect**: `/`
- **Note**: `plan = null/undefined` is now allowed (fix applied)

#### C. Onboarding Page Access (`validateOnboarding`)
- **Condition**: URL includes `'onboarding'`
- **Logic**: See section 3 below

#### D. Classroom Access (`validateClassroomAccess`)
- **Condition**: URL includes `classroomId` parameter
- **Logic**: See section 4 below

---

## 3. Onboarding Page Validation (`validateOnboarding`)

### Flow Entry Point
When accessing any URL containing `'onboarding'`.

### Conditions Checked (in order):

#### A. No Institution
- **Condition**: `!hasInstitution`
- **Result**: ✅ **Allow access**
- **Reason**: User needs to create institution

#### B. Teacher-Specific Checks

1. **No Classrooms**
   - **Condition**: `role === 'teacher' && (!classrooms || classrooms.length === 0)`
   - **Result**: ✅ **Allow access**
   - **Reason**: Teacher needs to create classrooms

2. **On Trial Without Selected Plan**
   - **Condition**: `role === 'teacher' && plan === 'trial' && !selectedFreeTrialPlan`
   - **Result**: ✅ **Allow access**
   - **Reason**: Teacher needs to select a plan

3. **No Plan (null/undefined)**
   - **Condition**: `role === 'teacher' && plan == null`
   - **Result**: ✅ **Allow access** (latest fix)
   - **Reason**: Teacher needs to select a plan

#### C. Onboarding Ended
- **Condition**: `!role || onBoardingEnded`
- **Result**: ❌ **Redirect to `/`**
- **Note**: `onBoardingEnded = plan != null && (plan !== 'trial' || selectedFreeTrialPlan)`
- **Reason**: User has completed onboarding

---

## 4. Classroom Access Validation (`validateClassroomAccess`)

### Flow Entry Point
When accessing any URL with a `classroomId` parameter (e.g., `/classes/[classroomId]`).

### Conditions Checked:

#### A. Principal Role
- **Condition**: `role === 'principal'`
- **Logic**: Checks if classroom belongs to principal's institution
- **If invalid**: Redirect to `/institutions/${userInstitutionId}`

#### B. Teacher/Coordinator Role

1. **No Classrooms**
   - **Condition**: `!classrooms || classrooms.length === 0`
   - **Redirect**: `/`
   - **Reason**: Teacher has no classrooms, go to home (which will redirect to onboarding)

2. **Classroom Not in User's Classrooms**
   - **Condition**: `!classrooms?.includes(classroomId)`
   - **Redirect**: `/classes/${classrooms[0]}`
   - **Reason**: Redirect to first available classroom
   - **Note**: If redirecting to same classroom, redirects to `/` instead (prevents loop)

---

## 5. Other Redirect Scenarios

### A. Invalid Plan Authorization
- **Location**: `isAuthorized` function
- **Condition**: Plan exists but not in `authorizedPlans`
- **Redirect**: `/`

### B. Institution Access Validation
- **Location**: `validateInstitutionAccess`
- **Condition**: User tries to access institution they don't belong to
- **Redirect**: `/`

### C. Student Access Validation
- **Location**: `validateStudentAccess`
- **Condition**: User tries to access student from different institution
- **Redirect**: `/`

---

## Current Issue Analysis

### Problem Scenario:
Teacher has:
- ✅ Institution assigned
- ✅ Classrooms assigned
- ❌ `plan = null/undefined`

### Expected Behavior:
Should redirect to `/classes/[classroomId]` (not onboarding)

### Actual Behavior (before fixes):
Was redirecting to `/users/onboarding` due to:
1. `validateOnboarding` treating `plan = null` as "onboarding ended" → redirecting to `/`
2. `/` then redirecting back to onboarding → loop

### Fixes Applied:
1. ✅ `isAuthorized`: Allow `plan = null/undefined`
2. ✅ `index.js`: Don't redirect to onboarding if teacher has institution + classrooms (even without plan)
3. ✅ `validateOnboarding`: Allow teachers with `plan = null` to access onboarding if they somehow get there
4. ✅ `validateOnboarding`: Fix `onBoardingEnded` calculation to handle `null` plans correctly

---

## Debugging Checklist

If a teacher is still being redirected incorrectly, check:

1. ✅ Does user have `institution` or `institutionId`?
2. ✅ Does user have `classrooms` array with at least one classroom?
3. ✅ What is the value of `plan`? (null, undefined, 'trial', etc.)
4. ✅ What is the value of `selectedFreeTrialPlan`?
5. ✅ What is the value of `role`? (should be 'teacher')
6. ✅ What URL are they trying to access?
7. ✅ Check browser console/network tab for redirect chain

---

## Key Files

- `pages/index.js` - Root redirect logic
- `services/Authorization.js` - Authorization middleware and validators
- `pages/users/onboarding/index.js` - Onboarding page
- `pages/classes/[classroomId]/index.js` - Classroom page

