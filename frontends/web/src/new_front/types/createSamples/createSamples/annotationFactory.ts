export type AnnotationFactoryType = {
  onInputChange: (values: object, metadata?: boolean) => void;
  task: object;
  hidden?: boolean;
};

export type ContextAnnotationFactoryType = AnnotationFactoryType & {
  setIsGenerativeContext: (isGenerative: boolean) => void;
  createPartialSample?: () => void;
  context: any;
};
