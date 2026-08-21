// Server-rendered, self-contained HTML template for the experience PDF.
// Never accepts client HTML: the activity comes straight from the DB.

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const listHtml = (items) =>
  `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

const section = (title, content) => `
  <section>
    <h2>${escapeHtml(title)}</h2>
    ${content}
  </section>`;

export const buildActivityHtml = (activity) => {
  const ai = activity.assets?.aiGeneration;
  const levels = (activity.Levels || []).map((level) => level.name).join(' · ');
  const cores = (activity.Cores || []).map((core) => core.name).join(' · ');

  const sections = [];

  if (ai?.summary) sections.push(`<p class="summary">${escapeHtml(ai.summary)}</p>`);

  if (Array.isArray(activity.materials) && activity.materials.length) {
    sections.push(section('Materiales', listHtml(activity.materials)));
  }

  const steps = Array.isArray(activity.steps) ? activity.steps : [];
  ['inicio', 'desarrollo', 'cierre'].forEach((phase) => {
    const phaseSteps = steps.filter((step) => step.phase === phase).map((step) => step.text);
    if (phaseSteps.length) {
      sections.push(section(phase.charAt(0).toUpperCase() + phase.slice(1), listHtml(phaseSteps)));
    }
  });

  // Non-AI activities keep their HTML description (trusted: authored via the app).
  if (!steps.length && activity.description) {
    sections.push(section('Descripción', activity.description));
  }

  if (ai?.oas?.length) {
    sections.push(section(
      'Objetivos de Aprendizaje (Bases Curriculares)',
      ai.oas.map((oa) => `
        <div class="oa">
          <p class="oa-title">${escapeHtml(oa.code)} · ${escapeHtml(oa.nucleo)}</p>
          <p class="oa-text">${escapeHtml(oa.text)}</p>
          <p class="oa-how">${escapeHtml(oa.comoSeAborda)}</p>
        </div>`).join('')
    ));
  }

  if (ai?.preguntasParaElAprendizaje?.length) {
    sections.push(section('Preguntas para el aprendizaje', listHtml(ai.preguntasParaElAprendizaje)));
  }

  if (ai?.adaptaciones?.length) {
    sections.push(section(
      'Adaptaciones',
      listHtml(ai.adaptaciones.map((a) => `${a.tipo}: ${a.descripcion}`))
    ));
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Poppins', sans-serif; color: #444; margin: 32px 40px; font-size: 12px; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #fb9f71; padding-bottom: 12px; margin-bottom: 16px; }
  header .brand { font-size: 20px; font-weight: 700; color: #fb9f71; }
  header .meta { text-align: right; color: #888; font-size: 11px; }
  h1 { color: #575757; font-size: 22px; margin: 0 0 4px; }
  h2 { color: #fb9f71; font-size: 14px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary { font-size: 13px; color: #666; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin-bottom: 4px; }
  .oa { margin-bottom: 10px; }
  .oa-title { font-weight: 600; color: #575757; margin: 0; }
  .oa-text { margin: 2px 0; }
  .oa-how { margin: 0; color: #fb9f71; font-style: italic; }
  footer { margin-top: 24px; border-top: 1px solid #eee; padding-top: 8px; color: #aaa; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <header>
    <div class="brand">Unga</div>
    <div class="meta">
      ${levels ? `<div>${escapeHtml(levels)}</div>` : ''}
      ${cores ? `<div>${escapeHtml(cores)}</div>` : ''}
      ${ai?.durationMinutes ? `<div>${ai.durationMinutes} minutos</div>` : ''}
    </div>
  </header>
  <h1>${escapeHtml(activity.name)}</h1>
  ${sections.join('\n')}
  <footer>Experiencia de aprendizaje creada con Unga — app.unga.cl</footer>
</body>
</html>`;
};
