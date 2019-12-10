import { theme } from "../index";

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

  if (size.w < parseInt(theme.breakpoint.xs.replace("px", ""))) {
    size.device = DeviceSizes.xs;
  } else if (size.w < parseInt(theme.breakpoint.sm.replace("px", ""))) {
    size.device = DeviceSizes.sm;
  } else if (size.w < parseInt(theme.breakpoint.md.replace("px", ""))) {
    size.device = DeviceSizes.md;
  } else if (size.w < parseInt(theme.breakpoint.lg.replace("px", ""))) {
    size.device = DeviceSizes.lg;
  } else {
    size.device = DeviceSizes.xl;
  }
  return size;
}
