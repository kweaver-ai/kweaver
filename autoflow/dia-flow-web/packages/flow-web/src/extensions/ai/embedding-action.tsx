import {
  forwardRef,
  // useImperativeHandle,
  // useLayoutEffect,
  // useRef,
} from "react";
// import { Form, Select, Radio, Input, Button } from "antd";
// import { DefaultOptionType } from "antd/lib/select";
// import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
// import useSWR from "swr";
// import { API } from "@applet/common";
// import { FormItem } from "../../components/editor/form-item";
import {
  ExecutorAction,
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import EmbeddingSVG from "./assets/embedding.svg";
// import styles from "./embedding-action.module.less";
import { CommonSmallModelConfig } from "./common-small-model-config";

interface EmbeddingParameters {
  model: string; // 模型名称
  input: string[] | string; // 文本数组，待embedding 内容，至少包含一项;或者变量
}

// interface InputDataProps {
//   t: (key: string, defaultValue?: string) => string;
//   value?: string[];
//   onChange?: (value: string[] | string) => void;
// }

// const DataInput = forwardRef(({ t, value, onChange }: InputDataProps, ref) => {
//   const [form] = Form.useForm<InputDataProps>();
//   const isSingle = Array.isArray(value);

//   useImperativeHandle(ref, () => {
//     return {
//       validate() {
//         return form.validateFields().then(
//           () => true,
//           () => false
//         );
//       },
//     };
//   });

//   return (
//     <>
//       {/* <Radio.Group
//         defaultValue={isSingle}
//         optionType="button"
//         className={styles["data-input-radio-group"]}
//         onChange={(e) => {
//           onChange?.(e.target.value === "true" ? [""] : "");
//         }}
//       >
//         <Radio value={true} className={styles["radio"]}>
//           手动输入
//         </Radio>
//         <Radio value={false} className={styles["radio"]}>
//           选择数组变量
//         </Radio>
//       </Radio.Group> */}

//       <Form
//         autoComplete="off"
//         form={form}
//         initialValues={isSingle ? { text: value } : { variable: value }}
//         onFieldsChange={() => {
//           const text = form.getFieldValue("text");
//           const variable = form.getFieldValue("variable");
//           const value = variable || text;

//           if (!value) {
//             form.setFieldValue("text", [""]);
//           }

//           onChange?.(value || [""]);
//         }}
//       >
//         <FormItem
//           name="variable"
//           allowVariable
//           required
//           label="待向量处理的文本"
//           className={isSingle ? styles["hidden"] : ""}
//           chooseVariableBtnText="选择数组变量"
//         >
//           <Input />
//         </FormItem>
//         <FormItem required style={{ marginTop: "-54px" }}>
//           {isSingle && (
//             <Form.List name="text">
//               {(fields, { add, remove }) => {
//                 return (
//                   <div className={styles["input-list"]}>
//                     {fields.map((field, index) => (
//                       <div
//                         className={styles["text-item-wrapper"]}
//                         key={field.key}
//                       >
//                         <FormItem
//                           {...field}
//                           allowVariable
//                           chooseVariableBtnText="选择文本变量"
//                           requiredMark={false}
//                           label={`文本${index + 1}`}
//                           className={styles["form-item"]}
//                           rules={[
//                             {
//                               required: true,
//                               message: t("emptyMessage", "此项不能为空"),
//                             },
//                           ]}
//                         >
//                           <Input placeholder="请输入" />
//                         </FormItem>

//                         {fields.length > 1 && (
//                           <Button
//                             type="text"
//                             icon={<CloseOutlined />}
//                             className={styles["close-btn"]}
//                             onClick={() => {
//                               remove(index);
//                             }}
//                           />
//                         )}
//                       </div>
//                     ))}

//                     <FormItem>
//                       <Button
//                         icon={<PlusOutlined />}
//                         type="link"
//                         onClick={() => add("")}
//                       >
//                         添加更多文本
//                       </Button>
//                     </FormItem>
//                   </div>
//                 );
//               }}
//             </Form.List>
//           )}
//         </FormItem>
//       </Form>
//     </>
//   );
// });

export const EmbeddingConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<EmbeddingParameters>
>((props, ref) => {
  // const [form] = Form.useForm<EmbeddingParameters>();
  // const dataInputRef = useRef<{ validate: () => boolean }>(null);

  // const { data: embeddingModelOptions } = useSWR<DefaultOptionType[]>(
  //   "/api/mf-model-manager/v1/small-model/list?page=1&size=1000",
  //   async (url) => {
  //     try {
  //       const { data } = await API.axios.get(url);
  //       if (Array.isArray(data?.data)) {
  //         // 过滤出 embedding 模型
  //         const modelNames: string[] = data.data
  //           .filter((item: any) => item.model_type === "embedding")
  //           .map((item: any) => item.model_name as string);
  //         return Array.from(new Set(modelNames), (name) => ({
  //           label: name,
  //           value: name,
  //         }));
  //       }
  //     } catch (e) {}

  //     return [];
  //   },
  //   {
  //     revalidateIfStale: false,
  //     revalidateOnFocus: false,
  //   }
  // );

  // useImperativeHandle(ref, () => {
  //   return {
  //     validate() {
  //       if (dataInputRef.current) {
  //         return dataInputRef.current.validate?.();
  //       }

  //       return form.validateFields().then(
  //         () => true,
  //         () => false
  //       );
  //     },
  //   };
  // });

  // useLayoutEffect(() => {
  //   form.setFieldsValue(parameters);
  // }, [form, parameters]);

  // return (
  //   <Form
  //     form={form}
  //     layout="vertical"
  //     autoComplete="off"
  //     initialValues={parameters}
  //     onFieldsChange={() => {
  //       onChange(form.getFieldsValue());
  //     }}
  //   >
  //     <FormItem
  //       name="model"
  //       label="小模型"
  //       rules={[
  //         {
  //           required: true,
  //           message: t("emptyMessage", "此项不能为空"),
  //         },
  //       ]}
  //     >
  //       <Select
  //         options={embeddingModelOptions}
  //         placeholder={t("modelPlaceholder", "请选择")}
  //       />
  //     </FormItem>

  //     {parameters.model && (
  //       <FormItem name="input" label="">
  //         <DataInput t={t} ref={dataInputRef} />
  //       </FormItem>
  //     )}
  //   </Form>
  // );
  return <CommonSmallModelConfig {...props} ref={ref} modelType="embedding" />;
});

export const EmbeddingAction: ExecutorAction = {
  name: "EAEmbedding",
  description: "EAEmbeddingDescription",
  operator: "@llm/embedding",
  icon: EmbeddingSVG,
  outputs: [
    {
      key: ".data",
      type: "array",
      name: "EAEmbeddingOutputData",
    },
  ],
  components: {
    Config: EmbeddingConfig,
  },
};
