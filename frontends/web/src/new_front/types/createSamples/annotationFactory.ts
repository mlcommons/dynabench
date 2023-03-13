export type AnnotationFactoryType = {
  onInputChange: (values: object) => void;
  task: object;
};

export type ContextAnnotationFactoryType = AnnotationFactoryType & {
  setIsGenerativeContext: (isGenerative: boolean) => void;
  context: any;
};
