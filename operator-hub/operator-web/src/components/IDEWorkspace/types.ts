import { type ParamItem } from '@/components/IDEWorkspace/Metadata/types';

export enum ActionEnum {
  Create = 'create',
  Edit = 'edit',
}

export interface ToolDetail {
  name?: string;
  description?: string;
  use_rule?: string;
  inputs?: ParamItem[];
  outputs?: ParamItem[];
  code?: string;
  script_type: 'python';
  operator_info?: {
    is_data_source?: boolean;
  };
  operator_execute_control?: {
    timeout?: number;
  };
}
