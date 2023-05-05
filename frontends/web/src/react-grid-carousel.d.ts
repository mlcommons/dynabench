declare module "react-grid-carousel" {
  export default Carousel;
  declare function Carousel({
    cols,
    rows,
    gap,
    loop,
    scrollSnap,
    hideArrow,
    showDots,
    autoplay,
    dotColorActive,
    dotColorInactive,
    responsiveLayout,
    mobileBreakpoint,
    arrowLeft,
    arrowRight,
    dot,
    containerClassName,
    containerStyle,
    children,
  }: {
    cols?: number;
    rows?: number;
    gap?: number;
    loop?: boolean;
    scrollSnap?: boolean;
    hideArrow?: boolean;
    showDots?: boolean;
    autoplay: any;
    dotColorActive?: string;
    dotColorInactive?: string;
    responsiveLayout: any;
    mobileBreakpoint?: number;
    arrowLeft: any;
    arrowRight: any;
    dot: any;
    containerClassName?: string;
    containerStyle?: {};
    children: any;
  }): JSX.Element;
  declare namespace Carousel {
    namespace propTypes {
      export { positiveNumberValidator as cols };
      export { positiveNumberValidator as rows };
      export const gap: any;
      export const loop: any;
      export const scrollSnap: any;
      export const hideArrow: any;
      export const showDots: any;
      export const autoplay: any;
      export const dotColorActive: any;
      export const dotColorInactive: any;
      export const responsiveLayout: any;
      export const mobileBreakpoint: any;
      export const arrowLeft: any;
      export const arrowRight: any;
      export const dot: any;
      export const containerClassName: any;
      export const containerStyle: any;
    }
    function Item({ children }: { children: any }): any;
    namespace Item {
      export { CAROUSEL_ITEM as displayName };
    }
  }
  declare function positiveNumberValidator(
    props: any,
    propName: any,
    componentName: any
  ): Error;
  declare const CAROUSEL_ITEM: "CAROUSEL_ITEM";
}
