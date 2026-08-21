// Redirect ladder for logged-in users landing on '/'.
// Logged-out visitors never get here: they see the public landing.
const redirect = (destination) => ({ redirect: { permanent: false, destination } });

export const getRedirectForUser = (user) => {
  const {
    institution,
    institutionId,
    class: _class,
    role,
    classrooms,
    plan,
    deletedAt,
  } = user;

  if (deletedAt) return redirect('/not-authorized');
  if (role === 'superAdmin') return redirect('/super-admin/pmf-answers');
  if (!role) return redirect('/users/select-role');

  if (role === 'parent') {
    if (plan !== 'parentsBase') return redirect('/users/onboarding/parents');
    return redirect('/parents');
  }

  if (role === 'teacher' || role === 'coordinator' || role === 'principal') {
    const resolvedInstitutionId = institution?.id || institutionId;

    if (role === 'principal' || role === 'coordinator') {
      if (!resolvedInstitutionId) return redirect('/users/onboarding');
      return redirect(`/institutions/${resolvedInstitutionId}`);
    }

    if (!resolvedInstitutionId || !classrooms || classrooms.length === 0) {
      return redirect('/users/onboarding');
    }

    // B2C teachers live in the experiences library; institutional teachers
    // keep their classroom home.
    if (plan === 'institutional') {
      return redirect(`/classes/${_class?.id || classrooms[0]}`);
    }
    return redirect(`/institutions/${resolvedInstitutionId}/activities`);
  }

  return redirect('/404');
};
