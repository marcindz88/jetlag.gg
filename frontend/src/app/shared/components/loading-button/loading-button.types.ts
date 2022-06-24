export type LoadingButtonConfig = {
  currentProgress?: number;
  elapsedTime: number;
  totalTime: number;
  elapsingText?: string;
  showPercentage: boolean;
};

export const defaultLoadingButtonConfig = {
  currentProgress: 0,
  elapsedTime: 0,
  totalTime: 100,
  elapsingText: '',
  showPercentage: true,
};
