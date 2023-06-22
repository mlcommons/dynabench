export type ModelOutputType = {
  label: string | number;
  input: string | number;
  prediction: string | number;
  probabilities?: Probabilities[];
  fooled: boolean;
  sandBox: boolean;
};

export type Probabilities = {
  label: string;
  probability: number;
};
