export type ModelsInfo = {
  id: number;
  name: string;
  task: string;
  score: number;
  upload_datetime: string;
  is_published: number;
  community: string;
};

export type AllModelsInfo = {
  id: number;
  name: string;
  desc: string;
  longdesc: string;
  params: number;
  languages: string;
  license: string;
  source_url: string;
  light_model: number;
  deployment_status: string;
  is_in_the_loop: number;
  is_published: number;
  upload_datetime: string;
  community: string;
  task: string;
  score: number;
};
