// Server-only Spanish spellchecker: nspell (Hunspell in JS) + dictionary-es.
// Runs fully in-process, no external network calls, no per-request cost.
let spellPromise = null;

const loadSpell = async () => {
  if (!spellPromise) {
    spellPromise = (async () => {
      const { default: dictionary } = await import('dictionary-es');
      const { default: nspellFactory } = await import('nspell');
      return nspellFactory(dictionary);
    })();
  }
  return spellPromise;
};

const WORD_PATTERN = /[\p{L}]+/gu;

// Returns misspelled words found in `text`, each with up to 3 suggestions.
// `customWords` (e.g. student/teacher names) are added to the dictionary
// first so proper nouns aren't flagged as errors.
export const checkText = async (text, customWords = []) => {
  const spell = await loadSpell();
  customWords.forEach((word) => word && spell.add(word));

  const words = text.match(WORD_PATTERN) || [];
  const seen = new Set();
  const issues = [];

  for (const word of words) {
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (!spell.correct(word)) {
      issues.push({ word, suggestions: spell.suggest(word).slice(0, 3) });
    }
  }

  return issues;
};
