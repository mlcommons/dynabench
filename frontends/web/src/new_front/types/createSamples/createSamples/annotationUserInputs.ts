import ModulesRegistry from "new_front/utils/creation_interface_options.json";

export type AnnotationUserInput = {
  type: keyof typeof ModulesRegistry.user_input;
  metadata?: boolean;
  placeholder?: string;
  instructions?: string;
  options?: string[];
  field_name_for_the_model: string;
  options_slider?: any;
  show_na_checkbox?: boolean;
};
