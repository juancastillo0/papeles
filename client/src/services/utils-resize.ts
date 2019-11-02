export enum DeviceSizes {
  "xs",
  "sm",
  "md",
  "lg",
  "xl"
}

export function getWindowSize() {
  const size = {
    h: Math.min(window.outerHeight, window.innerHeight),
    w: Math.min(window.outerWidth, window.innerWidth),
    device: DeviceSizes.md
  };

  if (size.w < 576) {
    size.device = DeviceSizes.xs;
  } else if (size.w < 768) {
    size.device = DeviceSizes.sm;
  } else if (size.w < 992) {
    size.device = DeviceSizes.md;
  } else if (size.w < 1200) {
    size.device = DeviceSizes.lg;
  } else {
    size.device = DeviceSizes.xl;
  }
  return size;
}
