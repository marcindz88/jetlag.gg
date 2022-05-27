/* eslint-disable prettier/prettier */
const AVAILABLE_PLANE_COLORS = [
  '#E53935', '#D32F2F', '#C62828', '#B71C1C', '#D50000', // RED
  '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F', // PINK
  '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', // PURPLE
  '#673AB7', '#5E35B1', '#512DA8', '#4527A0', '#311B92', // DEEP PURPLE
  '#3F51B5', '#3949AB', '#3949AB', '#283593', '#1A237E', // INDIGO
  '#1E88E5', '#1976D2', '#1565C0', '#2979FF', '#0D47A1', // BLUE
  '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B', // LIGHT bLUE
  '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064', // CYAN
  '#009688', '#00897B', '#00796B', '#00695C', '#004D40', // TEAL
  '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', // GREEN
  '#F4511E', '#E64A19', '#D84315', '#BF360C',            // ORANGE
  '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723', // BROWN
  '#757575', '#424242',                                  // GRAY
  '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238'  // BLUE GRAY
]
/* eslint-enable prettier/prettier */

export const getRandomColorFromNickname = (nickname: string): string => {
  let sum = 0;
  for (let i = 0; i < nickname.length; i++) {
    sum += nickname.charCodeAt(i);
  }
  return AVAILABLE_PLANE_COLORS[sum % AVAILABLE_PLANE_COLORS.length];
};
