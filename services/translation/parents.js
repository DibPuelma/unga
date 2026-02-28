export default class ParentsTranslationService {
  static coresTranslations = {
    'Identidad y autonomía': 'Autonomía y autoconocimiento',
    'Convivencia y ciudadanía': 'Relaciones y convivencia',
    'Corporalidad y movimiento': 'Desarrollo físico y motor',
    'Lenguaje verbal': 'Desarrollo verbal',
    'Lenguajes artísticos': 'Expresión artística y musical',
    'Exploración del entorno natural': 'Comprensión del entorno natural',
    'Comprensión del entorno sociocultural': 'Comprensión del entorno social',
    'Pensamiento matemático': 'Matemáticas y lógica',
  }

  static allCores = Object.values(this.coresTranslations);

  static getAgesFromLevels(levels) {
    const ages = levels.map((level) => [level.ageFrom, level.ageUpTo]).flat();
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    return `${minAge} a ${maxAge} años`;
  }
}