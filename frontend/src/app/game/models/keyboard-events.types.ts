export enum KeyEventEnum {
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
  TURN_LEFT = 'TURN_LEFT',
  TURN_RIGHT = 'TURN_RIGHT',
  PLAYER_FOCUS_PREV = 'PLAYER_FOCUS_PREV',
  PLAYER_FOCUS_NEXT = 'PLAYER_FOCUS_NEXT',
  PLAYER_SELF_FOCUS = 'PLAYER_SELF_FOCUS',
  CAMERA = 'CAMERA',
  LAND_OR_TAKE_OFF = 'LAND_OR_TAKE_OFF',
  ENTER = 'ENTER',
  FUEL = 'FUEL',
  HELP = 'HELP',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// % or px
export type TouchEventLocation = { xMin: number; xMax: number; yMin: number; yMax: number };

export const touchEventMapper: { [key in KeyEventEnum]?: TouchEventLocation } = {
  [KeyEventEnum.FORWARD]: { xMin: 34, xMax: 66, yMin: 0, yMax: 33 },
  [KeyEventEnum.BACKWARD]: { xMin: 34, xMax: 66, yMin: 67, yMax: 100 },
  [KeyEventEnum.TURN_LEFT]: { xMin: 0, xMax: 33, yMin: 0, yMax: 100 },
  [KeyEventEnum.TURN_RIGHT]: { xMin: 67, xMax: 100, yMin: 0, yMax: 100 },
  [KeyEventEnum.LAND_OR_TAKE_OFF]: { xMin: 33, xMax: 66, yMin: 33, yMax: 66 },
};
