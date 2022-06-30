export const defaultLoadingButtonConfig = {
  initialProgress: 0,
  initialElapsedTime: 0,
  totalTime: 100,
  elapsingText: '',
  showPercentage: true,
};

export type LoadingButtonConfig = typeof defaultLoadingButtonConfig;
