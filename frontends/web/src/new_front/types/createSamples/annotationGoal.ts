import ModulesRegistry from "new_front/utils/interface_options.json";

export type GoalConfigType = {
  type: keyof typeof ModulesRegistry.goal;
  text: string;
  options: string[];
  field_name_for_the_model?: string;
  evaluation_label?: string;
};
