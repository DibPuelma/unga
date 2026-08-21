import { createUser } from 'db/user';
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { body } = req;
  if (req.method === 'POST') {
    const requiredParams = ['email', 'firstName', 'lastName', 'country', 'password'];
    for (const param of requiredParams) {
      if (!body[param]) return res.status(400).json({ message: `Parameter ${param} is required` });
    }

    // Public signup: role and plan are constrained — institutional accounts
    // are only created by an admin inviting the user.
    const role = body.role === 'parent' ? 'parent' : 'teacher';
    // The form sends country as { name, code }; the column is a String.
    const country = typeof body.country === 'string' ? body.country : body.country?.name || 'Chile';

    try {
      const query = await createUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        country,
        password: body.password,
        reference: body.reference || 'No especificado',
        role,
        plan: 'free',
      });
      return res.status(200).json(serializeForAPI(query));
    } catch (e) {
      console.error(e)
      if (e.code === 'P2002') {
        return res.status(400).json({ message: 'instance not unique' });
      }
      return res.status(400).json(e);
    }
  }
}
