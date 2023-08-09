// Props
// width: PropTypes.number,
//   img: PropTypes.string,
//   height: PropTypes.number,
//   zoomWidth: PropTypes.number,
//   scale: PropTypes.number,
//   offset: PropTypes.object,
//   zoomStyle: PropTypes.string,
//   zoomLensStyle: PropTypes.string,
//   zoomPosition: PropTypes.oneOf(['top', 'left', 'bottom', 'right', 'original'])

declare module "react-img-zoom" {
  export interface Zoom {
    width: number;
    img: string;
    height: number;
    className: string;
    zoomScale: number;
    transitionTime?: number;
  }
  export default class ImageZoom extends React.Component<Zoom> {}
}
