import { get } from "lodash";

export const ascendingSort = (array, field) => {
  return array.sort((a, b) => {
    if (get(a.data, field)?.localeCompare) return get(a.data, field).localeCompare(get(b.data, field));
    else return get(a.data, field) > get(b.data, field) ? 1 : -1;
  })
}

export const arrayToListText = (array) => {
  let text = '';
  if (array.length === 1) return array[0]
  array.forEach((value, i) => {
    if (i < array.length - 2) text += `${value}, `;
    else if (i === array.length - 2) text += `${value} y `;
    else text += value;
  })
  return text;
}

export const hasCommonElement = (array1, array2) => {
  return array1.some(element => array2.includes(element));
}