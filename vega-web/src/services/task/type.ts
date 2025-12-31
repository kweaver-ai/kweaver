namespace TaskType {
  export enum JobType {
    full = 'full',
    incremental = 'incremental',
  }
  export enum conceptTypeEnum {
    object = 'object_type',
  }

  export enum StateEnum {
    pending = 'pending',
    running = 'running',
    completed = 'completed',
    failed = 'failed',
    canceled = 'canceled',
  }

  export type TaskItemType = {
    id: string;
    job_type: JobType;
    state: StateEnum;
    start_time: number;
    finish_time: number;
  };
  export type TaskList = { entries: TaskItemType[]; total_count: number };

  export type taskChildType = {
    concept_id: string;
    concept_name: string;
    concept_type: conceptTypeEnum;
    finish_time: number;
    id: string;
    job_id: string;
    start_time: number;
    state: StateEnum;
    state_detail: '';
    time_cost: number;
  };
  export type TaskChildList = { entries: taskChildType[]; total_count: number };
}

export default TaskType;
