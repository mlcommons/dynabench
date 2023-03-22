import ModulesRegistry from "new_front/utils/creation_interface_options.json";

export type ContextConfigType = {
  type: keyof typeof ModulesRegistry.context;
  field_names_for_the_model: any;
  generative_context: GenerativeContext;
};

export type GenerativeContext = {
  is_generative: boolean;
  type: string;
  artifacts: object;
};
