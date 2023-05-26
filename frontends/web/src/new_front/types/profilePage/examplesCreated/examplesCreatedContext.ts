import ModulesRegistry from "new_front/utils/validation_interface_options.json";

export type ExamplesCreatedContext = {
  type: keyof typeof ModulesRegistry.context;
  label?: string;
  info?: string;
};
