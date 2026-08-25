// Server-only Spanish spellchecker: nspell (Hunspell in JS) + dictionary-es
// merged with dictionary-es-cl so Latin American vocabulary (zapallo, porotos,
// almácigo, …) isn't flagged. Runs fully in-process, no external network
// calls, no per-request cost.

// Chilean / early-education vocabulary missing from both dictionaries.
const REGIONAL_WORDS = [
  'guagua', 'guaguas', 'polera', 'poleras', 'tuto', 'tutos',
  'mudador', 'mudadores', 'pañalera', 'pañaleras', 'psicomotricidad',
  'plastilina', 'plastilinas', 'témpera', 'témperas', 'cuncuna', 'cuncunas',
  'heurística', 'heurísticas', 'heurístico', 'heurísticos', 'Montessori',
];

let spellPromise = null;

const loadSpell = async () => {
  if (!spellPromise) {
    spellPromise = (async () => {
      const { default: dictionaryEs } = await import('dictionary-es');
      const { default: dictionaryEsCl } = await import('dictionary-es-cl');
      const { default: nspellFactory } = await import('nspell');
      const spell = nspellFactory(dictionaryEs);
      spell.dictionary(dictionaryEsCl.dic);
      REGIONAL_WORDS.forEach((word) => spell.add(word));
      return spell;
    })();
  }
  return spellPromise;
};

const WORD_PATTERN = /[\p{L}]+/gu;

// Names can be stored as compound values ("María José"); match per token.
const toWordSet = (words) => {
  const set = new Set();
  words.forEach((value) => {
    (String(value).match(WORD_PATTERN) || []).forEach((token) => set.add(token.toLowerCase()));
  });
  return set;
};

// A capitalized word that doesn't open a sentence is almost always a proper
// noun (an untagged child, a relative, a place); suggestions for those are
// garbage ("Sophia → Sepia"), so they're never flagged.
const isSentenceStart = (text, index) => {
  for (let i = index - 1; i >= 0; i--) {
    const char = text[i];
    if (/[\s¡¿"'«“‘()\[\]—–-]/.test(char)) continue;
    return /[.!?:;\n]/.test(char);
  }
  return true;
};

const isCapitalized = (word) => word[0] !== word[0].toLowerCase();
const isAllCaps = (word) => word.length > 1 && word === word.toUpperCase();

const levenshtein = (a, b) => {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = a[i - 1] === b[j - 1]
        ? previous[j - 1]
        : 1 + Math.min(previous[j - 1], previous[j], current[j - 1]);
    }
    previous = current;
  }
  return previous[b.length];
};

// A suggestion further than a couple of edits away is noise ("zapallo →
// batallo"), and applying it silently corrupts the record. Better to flag
// the word with no replacement than to invent one.
const plausibleSuggestions = (word, suggestions) => {
  const maxDistance = word.length <= 4 ? 1 : 2;
  return suggestions.filter((suggestion) => (
    levenshtein(word.toLowerCase(), suggestion.toLowerCase()) <= maxDistance
  ));
};

// Returns misspelled words found in `text`, each with up to 3 suggestions.
// `customWords` (e.g. student/teacher names) are exempt from checking; they
// are matched against a per-call set instead of mutating the shared
// dictionary, so one classroom's names never leak into another's check.
export const checkText = async (text, customWords = []) => {
  const spell = await loadSpell();
  const known = toWordSet(customWords);

  const occurrences = new Map();
  for (const match of text.matchAll(WORD_PATTERN)) {
    const word = match[0];
    const key = word.toLowerCase();
    if (!occurrences.has(key)) occurrences.set(key, { word, midSentenceCapitalized: false });
    if (isCapitalized(word) && !isSentenceStart(text, match.index)) {
      occurrences.get(key).midSentenceCapitalized = true;
    }
  }

  const issues = [];
  for (const { word, midSentenceCapitalized } of occurrences.values()) {
    if (known.has(word.toLowerCase())) continue;
    if (midSentenceCapitalized || isAllCaps(word)) continue;
    if (spell.correct(word)) continue;
    issues.push({ word, suggestions: plausibleSuggestions(word, spell.suggest(word)).slice(0, 3) });
  }

  return issues;
};
