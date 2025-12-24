import { forwardRef } from "react";
import {
  ExecutorAction,
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import EmbeddingSVG from "./assets/embedding.svg";
// import styles from "./embedding-action.module.less";
import { CommonSmallModelConfig } from "./common-small-model-config";

interface RerankerParameters {
  model: string; // 模型名称
  input: string[] | string; // 文本数组，待embedding 内容，至少包含一项;或者变量
}

export const RerankerConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<RerankerParameters>
>((props, ref) => {
  return <CommonSmallModelConfig {...props} ref={ref} modelType="reranker" />;
});

export const RerankerAction: ExecutorAction = {
  name: "EAReranker",
  description: "EARerankerDescription",
  operator: "@llm/reranker",
  icon: EmbeddingSVG,
  outputs: [
    {
      key: ".results",
      type: "array",
      name: "EARerankerOutputResults",
    },
    {
      key: ".documents",
      type: "array",
      name: "EARerankerOutputDocuments",
    },
  ],
  components: {
    Config: RerankerConfig,
  },
};
