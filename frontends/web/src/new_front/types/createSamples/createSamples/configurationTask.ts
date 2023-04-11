export type InfoContextTask = {
  context_id: number;
  current_context: any;
  real_round_id: number;
  tags?: string | undefined;
};

export type ConfigurationTask = {
  goal: object;
  context: object;
  user_input: object[];
  required_fields: string[];
  model_input: object;
  response_fields: ResponseFields;
  model_output: ModelOutput;
  model_evaluation_metric: ModelEvaluationMetric;
  creation_samples_title?: string;
};

export type ValidationConfigurationTask = {
  validation_user_input: object[];
  validation_context: object[];
};

type ModelOutput = {
  model_prediction_label: string;
};

export type ModelEvaluationMetric = {
  metric_name: string;
  artifacts?: object;
};

type ResponseFields = {
  input_by_user: string;
};
