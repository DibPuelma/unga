# Meta Pixel + Conversions API (CAPI)

Tracking de la conversión B2C **inicio de prueba gratis** (`StartTrial`):
registro de una educadora que recibe 5 experiencias con IA sin tarjeta.

El evento se envía **dos veces a propósito** — una desde el navegador (Pixel) y
otra desde el servidor (CAPI) — con el **mismo `event_id`**, para que Meta las
una en una sola conversión. El Pixel se pierde con bloqueadores de anuncios e
ITP; CAPI siempre llega. Juntos dan cobertura completa sin contar doble.

## Dónde vive cada pieza

| Pieza | Archivo |
| --- | --- |
| Pixel base code (carga global, una sola vez) | `src/components/analytics/MetaPixel.js`, montado en `pages/_app.js` |
| Helper de cliente + nombre del evento + `custom_data` | `src/helpers/metaPixel.js` |
| Generación del `event_id` compartido | `services/meta/eventId.js` |
| Cliente de la Conversions API | `services/meta/conversionsApi.js` |
| Configuración por entorno | `services/meta/config.js` |
| Handler que confirma la prueba y dispara CAPI | `pages/api/users/index.js` |
| Disparo del Pixel en el cliente | `pages/auth/register.js` |

## Cómo funciona la deduplicación

1. `POST /api/users` crea la usuaria. Al volver de `createUser()`, `db/credits.js`
   ya otorgó los 5 créditos: **ahí** la prueba está confirmada.
2. El handler deriva `event_id = buildTrialStartedEventId(user.id)` — un UUID
   determinista a partir del id interno, no un valor aleatorio. Si el handler se
   reintenta, sale el mismo id y Meta sigue contando una conversión.
3. El handler envía `StartTrial` a la Graph API con ese `event_id`.
4. El handler devuelve `metaEventId` en la respuesta JSON.
5. `register.js` dispara `fbq('track', 'StartTrial', customData, { eventID })`
   con ese mismo string, antes de `signIn()`.

Meta deduplica cuando **`event_name` y `event_id` coinciden** en una ventana de
48 horas. Si el navegador nunca envía el suyo (bloqueador), CAPI cuenta 1. Si
ambos llegan, sigue siendo 1.

`metaEventId` viene `null` para registros de apoderados (`role: 'parent'`): crean
cuenta pero no entran a la prueba del producto para educadoras. Si algún día se
quiere contar también, cambia `startedTrial` en `pages/api/users/index.js`.

## Parámetros de matching (Event Match Quality)

CAPI envía, siempre hasheados con SHA-256 sobre el valor normalizado como exige
Meta (si no se normaliza, los hashes no calzan y el EMQ queda en 0):

| Parámetro | Origen | Normalización |
| --- | --- | --- |
| `em` | `user.email` | trim + minúsculas |
| `ph` | `user.phoneNumber` | sólo dígitos, con código de país |
| `fn` / `ln` | nombre y apellido | minúsculas, sólo letras |
| `external_id` | `user.id` (cuid interno) | trim |
| `client_ip_address` | primer IP de `x-forwarded-for` (el socket es el proxy en Vercel) | — sin hash |
| `client_user_agent` | header `user-agent` | — sin hash |
| `fbp` / `fbc` | cookies `_fbp` / `_fbc` | — sin hash |

Además: `action_source: "website"`, `event_time` en Unix timestamp del momento
real de la conversión y `event_source_url` tomado del `referer` (la página de
registro, no la ruta de API).

`_fbc` sólo existe si la usuaria llegó con `fbclid` en la URL **y** el Pixel base
alcanzó a cargar; por eso el Pixel se monta globalmente en `_app.js` y no sólo en
la página de registro.

## Configuración

En `.env` local y en las variables de entorno de Vercel:

```
NEXT_PUBLIC_META_PIXEL_ID=1446549157333102
META_CAPI_ACCESS_TOKEN=<token de Events Manager>
```

Opcionales: `META_CAPI_TEST_EVENT_CODE` (sólo para pruebas) y
`META_GRAPH_API_VERSION` (default `v21.0`).

El token se genera en **Events Manager → tu Pixel → Configuración → Conversions
API → Generar token de acceso**. Nunca se hardcodea ni se expone al navegador.

Sin `META_CAPI_ACCESS_TOKEN` la llamada de servidor se omite en silencio; sin
`NEXT_PUBLIC_META_PIXEL_ID` no se monta el Pixel. El registro funciona igual en
ambos casos.

## Cómo verificar en Test Events

1. Abre **Events Manager → Pixel `1446549157333102` → Test Events**.
2. Copia el **código de prueba** que aparece ahí (formato `TEST12345`).
3. Ponlo en `META_CAPI_TEST_EVENT_CODE` y reinicia el server (`yarn dev`).
   Sin esa variable el evento de servidor llega igual, pero a *Overview* con
   unos minutos de retraso en vez de a Test Events en vivo.
4. Para el Pixel del navegador, pega la URL de tu entorno en el campo
   *"Probar eventos del navegador"* de esa misma pantalla y abre la app ahí.
   (Alternativa: instala la extensión **Meta Pixel Helper** en Chrome.)
5. Regístrate como educadora en `/auth/register` con un email nuevo.

Qué deberías ver:

- Un `PageView` al cargar cualquier página.
- Un **`StartTrial`** con dos filas de origen — `Navegador` y `Servidor` —
  agrupadas bajo el mismo evento, con la etiqueta **"Deduplicado"** /
  *"Procesado y deduplicado"*. Al abrir el evento, el `ID de evento` debe ser
  **idéntico** en ambas filas.
- Si ves **dos `StartTrial` separados**, los `event_id` no coinciden: revisa que
  `register.js` esté leyendo `data.metaEventId` de la respuesta.

Verificaciones complementarias:

- **Red**: en DevTools → Network, filtra por `facebook.com/tr` — el request del
  Pixel debe llevar `eid=<uuid>` en la query string.
- **Servidor**: la consola del server no debe mostrar nada. Un
  `[meta-capi] Meta rechazó el evento` con el error de Meta indica token o
  payload mal configurados; el registro igual se completa.
- **Calidad de coincidencia**: en Events Manager → *Descripción general* del
  evento `StartTrial`, la *Calidad de coincidencia de eventos* debería subir a
  rango alto en 24-48h gracias a `em` + `ph` + `external_id` + `fbp`/`fbc`.

⚠️ **Antes de pasar a producción, borra `META_CAPI_TEST_EVENT_CODE`.** Los
eventos que llevan código de prueba no se atribuyen a campañas.
