import ModulesRegistry from "new_front/utils/interface_options.json";

export type AnnotationUserInput = {
  type: keyof typeof ModulesRegistry.input;
  placeholder?: string;
  instructions?: string;
  options?: string[];
  field_name_for_the_model: string;
};
