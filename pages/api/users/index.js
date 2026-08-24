import { createUser } from 'db/user';
import { serializeForAPI } from 'src/helpers/businessLogic';
import { buildTrialStartedEventId } from 'services/meta/eventId';
import { sendTrialStartedEvent } from 'services/meta/conversionsApi';

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

      // The trial is confirmed here, not on the button click: createUser has
      // returned, so db/credits.js already granted the SIGNUP_CREDITS
      // experiences. Parents get an account but not the educator trial the ads
      // are optimizing for, so they are not counted as a conversion.
      const startedTrial = role === 'teacher';
      let metaEventId = null;

      if (startedTrial) {
        metaEventId = buildTrialStartedEventId(query.id);
        // Awaited on purpose: on Vercel the lambda freezes once the response
        // is sent, so a dangling promise would be dropped. sendTrialStartedEvent
        // never throws and gives up after 3s, so signup cannot break on it.
        await sendTrialStartedEvent({ req, user: query, eventId: metaEventId });
      }

      // The browser fires the Pixel with this same id so Meta deduplicates the
      // two hits into a single StartTrial. Null means "no conversion here".
      return res.status(200).json({ ...serializeForAPI(query), metaEventId });
    } catch (e) {
      console.error(e)
      if (e.code === 'P2002') {
        return res.status(400).json({ message: 'instance not unique' });
      }
      return res.status(400).json(e);
    }
  }
}
