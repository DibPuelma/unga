function replaceValues(string, values) {
  Object.entries(values).forEach(([toReplace, replacement]) => string = string.replaceAll(toReplace, replacement));
  return string;
}

export function toAcronym(string) {
  return string.split(' ').map(i => {
    const char = i.charAt(0);
    if (char === 'y') return char;
    return char.toUpperCase()
  }).join('');
}

export function isEmail(email) {
  return String(email)
    .toLowerCase()
    .trim()
    .match(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    );
};

export function isChileanPhoneNumber(number) {
  if (number.length !== 8) return false;
  if (isNaN(number)) return false;

  return true;
}

export function stringToColor(string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function openAiResponseToHTML(response) {
  return `<p>${response.replaceAll('\n', '<br>')}</p>`;
}

export function cleanFromCSVTemplate(string) {
  const values = {
    'ãº': 'ú',
    'ã¡': 'á',
    'ã³': 'ó',
    'ã­': 'í',
  }
  return replaceValues(string, values);
}

export function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}