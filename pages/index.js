import React from 'react';
import Head from 'next/head';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getRedirectForUser } from 'services/HomeRedirect';
import LandingPage from 'src/components/landing';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return { props: { landing: true } };
  }

  return getRedirectForUser(session.user);
}

export default function Index() {
  return (
    <>
      <Head>
        <title>Unga — Crea experiencias de aprendizaje con IA para educación parvularia</title>
        <meta
          name="description"
          content="Unga ayuda a educadoras de párvulo a crear experiencias de aprendizaje con inteligencia artificial, alineadas a las Bases Curriculares de Chile, listas para planificar e imprimir. Parte gratis, sin tarjeta."
        />
        <meta property="og:title" content="Unga — Experiencias de aprendizaje con IA" />
        <meta
          property="og:description"
          content="Crea experiencias de aprendizaje alineadas a las Bases Curriculares en segundos. 5 experiencias gratis, sin tarjeta."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://app.unga.cl/" />
        <meta property="og:image" content="https://app.unga.cl/logo-orange.png" />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href="https://app.unga.cl/" />
      </Head>
      <LandingPage />
    </>
  );
}
