import { API } from "@applet/common";
import { AxiosRequestConfig } from "axios";
import JSON5 from "json5";

export interface AgentInfo {
  name: Agent;
  agent_id: string;
  version: string;
}

export enum Agent {
  Analyzer = "anyshare_automation_dag_analyzer",
  Generator = "anyshare_automation_dag_generator",
  ExtractReferences = "anyshare_automation_extract_references",
  Check = "anyshare_automation_check",
}

interface CallAgentRes {
  answer: Record<string, any>;
  block_answer: Record<string, any>;
  status: "True" | "False";
}

export function getAgentAnswerText(res: CallAgentRes): string{

  if(!res.answer["answer"]){
    return ""
  }
  
  if(typeof res.answer["answer"] === "string"){
    return res.answer["answer"]
  }

  if(typeof res.answer["answer"]["answer"] === "string"){
    return res.answer["answer"]["answer"]
  }

  return ""
}

export async function callAgent(agent: string, inputs: any, config?: AxiosRequestConfig): Promise<CallAgentRes> {
  const { data } = await API.axios.post<CallAgentRes>(`/api/automation/v1/agent/${agent}`, inputs, config);
  return data;
}

export function parseJSON<T = object>(raw: any, defaultValue?: T): T | undefined {
  if (typeof raw !== "string") return defaultValue || raw;

  raw = raw
    .replace(/\\{\\{/g, "{{") // 移除转义字符
    .replace(/\\}\\}/g, "}}");

  const match = raw.match(/```json([\s\S]*?)```/);
  if (match) {
    raw = match[1];
  }

  try {
    return JSON5.parse(raw) as T;
  } catch (e) {
    return defaultValue;
  }
}

export interface ExtractReferenceItem {
  name: string;
  type: string;
  exists: boolean;
}
