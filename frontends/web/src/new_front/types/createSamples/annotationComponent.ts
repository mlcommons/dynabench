import { AnnotationComponentBaseProps } from "./annotationComponentBase";

export interface AnnotationComponentProps extends AnnotationComponentBaseProps {
  displayName: string;
  create: boolean;
  showName: boolean;
  strategyAnnotation: string;
}
