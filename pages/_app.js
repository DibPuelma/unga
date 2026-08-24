import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { SessionProvider } from "next-auth/react"
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../src/createEmotionCache';
import moment from 'moment';
import 'moment/locale/es';
// import mixpanel from 'mixpanel-browser';
import { hotjar } from 'react-hotjar'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers';
import NextNProgress from "nextjs-progressbar";

import { DialogContextProvider } from '../src/context/DialogContext';
import { PlanningContextProvider } from '../src/context/PlanningContext';
import { UserContextProvider } from '../src/context/UserContext';
import { MixpanelContextProvider } from '../services/MixpanelContext';
import ConfirmationDialog from '../src/components/dialogs/ConfirmationDialog';
import Layout from '../src/components/layout/Layout';
import MetaPixel from '../src/components/analytics/MetaPixel';
import UngaThemeProvider from 'src/themes/UngaThemeProvider';
import '../styles/global.css';
import { AdvancedReportContextProvider } from 'src/context/AdvancedReportContext';
import PMFDialog from 'src/components/dialogs/PMFDialog';


// Set locale to spanish
moment.locale('es');

// const mixpanelToken = process.env.NODE_ENV === 'development'
//   ? process.env.NEXT_PUBLIC_MIXPANEL_DEV_TOKEN
//   : process.env.NEXT_PUBLIC_MIXPANEL_PROD_TOKEN

// const debugMode = process.env.NODE_ENV === 'development'
// mixpanel.init(mixpanelToken, { debug: debugMode });

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  const {
    Component,
    emotionCache = clientSideEmotionCache,
    pageProps: { session, ...pageProps },
  } = props;

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_HOTJAR_HJID && process.env.NEXT_PUBLIC_HOTJAR_HJSV) {
      hotjar.initialize(process.env.NEXT_PUBLIC_HOTJAR_HJID, process.env.NEXT_PUBLIC_HOTJAR_HJSV)
    }
  }, []);

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <CacheProvider value={emotionCache}>
        <UngaThemeProvider>
        <Head>
          <title>Unga</title>
          <meta name="description" content="Medición del aprendizaje en educación de párvulos" />
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
          {/* Fuera del Layout: el pixel debe cargar también en las páginas de
              auth y en la landing, que se renderizan sin el chrome de la app. */}
          <MetaPixel />
          <UserContextProvider>
            <MixpanelContextProvider>
              <DialogContextProvider>
                <PlanningContextProvider>
                  <AdvancedReportContextProvider>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <Layout>
                        <CssBaseline />
                        <NextNProgress />
                        <Component {...pageProps} />
                      </Layout>
                    </LocalizationProvider>
                  </AdvancedReportContextProvider>
                  <ConfirmationDialog />
                  <PMFDialog />
                </PlanningContextProvider>
              </DialogContextProvider>
            </MixpanelContextProvider>
          </UserContextProvider>
        </UngaThemeProvider>
      </CacheProvider>
    </SessionProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
