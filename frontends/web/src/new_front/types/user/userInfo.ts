export type UserInfoProps = {
  id: number;
  forgot_password_token: null | string;
  metadata_json: string;
  streak_days_last_model_wrong: string;
  admin: number;
  forgot_password_token_expiry_date: null | string;
  examples_submitted: number;
  api_token: string;
  username: string;
  total_retracted: number;
  examples_verified: number;
  avatar_url: null | string;
  email: string;
  examples_verified_correct: null | string;
  models_submitted: number;
  password: string;
  total_verified_fooled: number;
  unseen_notifications: number;
  realname: null | string;
  total_verified_not_correct_fooled: number;
  streak_examples: number;
  affiliation: null | string;
  total_fooled: number;
  streak_days: number;
  settings_json: null | string;
  badges: any[][];
};

export type UserStatsProps = {
  total_examples: number;
  total_validations: number;
  total_models: number;
  model_fooling_rate: number;
};
