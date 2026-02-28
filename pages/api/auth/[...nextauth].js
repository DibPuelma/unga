import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import React from "react";

import prisma from "../../../lib/prisma"
import ResetPasswordEmail from "../../../src/emails/resetPassword";
import { login } from "db/auth";
import { checkEmailExists, getUserData } from "db/user";
import { sendEmail } from "services/email/resend";

export const authOptions = {
  // https://next-auth.js.org/providers/overview
  providers: [
    EmailProvider({
      from: "esteban@ungapp.com",
      async sendVerificationRequest({
        identifier: email,
        url,
        provider: { from },
      }) {
        const validUser = await checkEmailExists(email);
        if (validUser) {
          const { host } = new URL(url)
          await sendEmail({
            to: email,
            from,
            subject: 'Cambia tu contraseña en Unga',
            react: <ResetPasswordEmail url={url} host={host} email={email} />,
          })
        } else {
          throw new Error(JSON.stringify({ error: 'No existe un usuario con este correo', status: false }))
        }
      },
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Usuario y contraseña",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Email", type: "text", placeholder: "Ingresa tu email" },
        password: { label: "Contraseña", type: "password", placeholder: "Ingresa tu contraseña" }
      },
      async authorize(credentials) {
        const userData = await login(credentials);
        if (!userData) return null;

        const userId = userData.id;
        const user = await getUserData(userId);
        if (user.deletedAt) return null;

        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return { ...user, id: user.id };
        } else {
          return null

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      }
    }),
  ],
  adapter: PrismaAdapter(prisma),
  pages: {
    verifyRequest: '/auth/verify',
    signIn: '/auth/login',
  },
  callbacks: {
    async session({ session, user, token }) {
      let updatedUser = null;
      if (user) {
        const id = user.id
        updatedUser = await getUserData(id)
        session.user = { ...updatedUser, id };
      }
      else if (token.user) {
        const id = token.user.id
        updatedUser = await getUserData(id)
        session.user = { ...updatedUser, id };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.user = user;

      return token;
    }
  },
  session: {
    // Choose how you want to save the user session.
    // The default is `"jwt"`, an encrypted JWT (JWE) stored in the session cookie.
    // If you use an `adapter` however, we default it to `"database"` instead.
    // You can still force a JWT session by explicitly defining `"jwt"`.
    // When using `"database"`, the session cookie will only contain a `sessionToken` value,
    // which is used to look up the session in the database.
    strategy: 'jwt',

    // Seconds - How long until an idle session expires and is no longer valid.
    maxAge: 30 * 24 * 60 * 60, // 30 days

    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    updateAge: 24 * 60 * 60, // 24 hours
  }
}

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth(authOptions);
