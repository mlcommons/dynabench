import ModulesRegistry from "new_front/utils/creation_interface_options.json";

export type GoalConfigType = {
  type: keyof typeof ModulesRegistry.goal;
  text: string;
  options: any[];
  field_name_for_the_model?: string;
  metadata?: boolean;
  evaluation_label?: string;
};
