import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    borderRadius: string;

    colors: {
      auxLight: string;
      auxLighter: string;

      primary: string;
      primaryLight: string;
      primaryDark: string;

      secondary: string;
      secondaryLight: string;
      secondaryDark: string;
    };

    breakpoint: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
    };
  }
}
