export type AnnotationFactoryType = {
  instruction?: any;
  hidden?: boolean;
  groupby?: number;
};

export type ContextAnnotationFactoryType = AnnotationFactoryType & {
  setIsGenerativeContext: (isGenerative: boolean) => void;
  setPartialSampleId: (partialSampleId: number) => void;
  context: any;
  contextId: number;
  taskId?: number;
  realRoundId: number;
  userId?: number;
  setContextInfo?: (taskContextInfo: any) => void;
};
