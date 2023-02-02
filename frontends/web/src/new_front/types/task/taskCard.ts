import { TaskCategories } from "./taskCategories";

export type TaskCardProps = {
  id: number;
  name: string;
  description: string;
  curRound: number;
  totalCollected: number;
  totalFooled: number;
  taskCode: string;
  imageUrl: string;
  tasksCategories: TaskCategories[];
};
