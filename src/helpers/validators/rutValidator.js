"use strict"

/*
Andrés Fuenzalida - 2021
https://github.com/afuenzalida
*/

/**
 * @param {(string|number)} rut
 * @returns {boolean}
 */
export function validateRUT(rut) {
  if (typeof rut !== 'string' && typeof rut !== 'number') {
    throw new TypeError('Input parameter must be of type string or integer')
  }

  const cleanRUT = typeof rut === 'string' ? clearRUT(rut) : String(rut)
  const checkDigit = [...cleanRUT].slice(-1)[0]
  if (!Boolean(checkDigit)) return false;

  const withoutCheckDigitRUT = cleanRUT.slice(0, -1)
  const obtainedCheckDigit = getCheckDigit(withoutCheckDigitRUT)

  return checkDigit.toLowerCase() === obtainedCheckDigit.toLowerCase()
}

/**
 * @param {(string|number)} rut
 * @returns {string}
 */
function getCheckDigit(rut) {
  var M = 0, S = 1;
  for (; rut; rut = Math.floor(rut / 10))
    S = (S + rut % 10 * (9 - M++ % 6)) % 11;
  return S ? (S - 1).toString() : 'K';
  // const cleanRUT = clearRUT(rut)
  // const reversedRUT = [...String(cleanRUT)].map(v => parseInt(v)).reverse()
  // let result = 0

  // for (let i = 0, j = 2; i < reversedRUT.length; i++, j < 7 ? j++ : j = 2) {
  //   result += reversedRUT[i] * j;
  // }

  // return (11 - (result % 11)) <= 9 ? String((11 - (result % 11))) : 'K'
}

/**
 * @param {string} rut
 * @returns {string}
 */
function clearRUT(rut) {
  return String(rut).replace(/[^0-9a-z]/gi, '');
}

/**
 * @param {number} amount
 * @param {boolean} dots
 * @param {boolean} hyphen
 * @returns {Array<string>}
 */
function generateRandomRUT(amount = 1, dots = false, hyphen = false) {
  const generatedRUTs = [...Array(amount).keys()].map(() => {
    const rut = Math.floor(1000000 + Math.random() * 30000000)
    return `${dots ? rut.toLocaleString() : rut}${hyphen ? '-' : ''}${getCheckDigit(rut)}`
  })

  return amount === 1 ? generatedRUTs[0] : generatedRUTs
}