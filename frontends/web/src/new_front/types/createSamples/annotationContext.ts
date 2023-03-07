import ModulesRegistry from "new_front/utils/interface_options.json";

export type ContextConfigType = {
  type: keyof typeof ModulesRegistry.context;
  field_names_for_the_model?: any;
};
