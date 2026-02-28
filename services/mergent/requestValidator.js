import crypto from 'crypto';

export const validateSignature = (signature, body = '') => {
  const hash = crypto
  .createHmac("sha1", process.env.MERGENT_API_KEY)
  .update(Buffer.from(body, "utf-8"))
  .digest("base64");

  return hash === signature;
}