export type AnnotationFactoryType = {
  hidden?: boolean;
};

export type ContextAnnotationFactoryType = AnnotationFactoryType & {
  setIsGenerativeContext: (isGenerative: boolean) => void;
  setPartialSampleId: (partialSampleId: number) => void;
  context: any;
  contextId: number;
  taskId?: number;
  realRoundId: number;
};
