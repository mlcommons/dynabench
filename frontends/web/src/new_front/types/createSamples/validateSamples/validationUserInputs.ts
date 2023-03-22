import ModulesRegistry from "new_front/utils/validation_interface_options.json";

export type ValidationUserInput = {
  type: keyof typeof ModulesRegistry.user_input;
  placeholder?: string;
  label?: string;
  options?: string[];
  field_name_for_the_model: string;
};
