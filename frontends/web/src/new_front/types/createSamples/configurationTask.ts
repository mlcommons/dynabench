export type InfoContextTask = {
  context_id: number;
  context_info: ConfigurationTask;
  current_context: any;
  real_round_id: number;
  tags?: string | undefined;
};

type ConfigurationTask = {
  goal: object;
  context: object;
  user_input: object[];
  model_input: object;
  response_fields: ResponseFields;
};

type ResponseFields = {
  input_by_user: string;
};
