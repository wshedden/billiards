export const TABLE_LENGTH = 2.54;
export const TABLE_WIDTH = 1.27;
export const BALL_DIAMETER = 0.05715;
export const BALL_RADIUS = BALL_DIAMETER / 2;
export const BALL_MASS = 0.17;

export const POCKET_RADIUS = BALL_RADIUS * 1.48;
export const CUSHION_HEIGHT = BALL_RADIUS * 1.2;
export const CUSHION_THICKNESS = 0.09;
export const RAIL_HEIGHT = 0.08;

export const FIXED_TIME_STEP = 1 / 60;
export const MAX_SUB_STEPS = 3;

export const STATE = {
  AIMING: 'aiming',
  CHARGING: 'charging',
  BALLS_MOVING: 'balls_moving',
};

export const BALL_STOP_THRESHOLD = 0.04;
