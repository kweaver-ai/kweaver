import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useMemo,
  createRef,
} from "react";
import { Form, Select, Radio, Input, Button } from "antd";
import { DefaultOptionType } from "antd/lib/select";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import useSWR from "swr";
import { API, TranslateFn } from "@applet/common";
import { FormItem } from "../../components/editor/form-item";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import EditorWithMentions from "./editor-with-mentions";
import styles from "./common-small-model-config.module.less";

interface EmbeddingParameters {
  model: string | undefined; // 模型名称
  input: string[] | string; // 文本数组，待embedding 内容，至少包含一项;或者变量
}
interface RerankerParameters {
  model: string | undefined; // 模型名称
  query: string; // 文本，不能为空
  documents: string[] | string; // 候选文本数组，至少包含一项；或者变量
}
type CommonSmallModelParameters = EmbeddingParameters | RerankerParameters;

interface InputDataProps {
  t: TranslateFn;
  modelType: "embedding" | "reranker";
  value?: string[];
  onChange?: (value: string[] | string) => void;
}

interface TextJoinInputProps {
  index: number;
  value?: string;
  removable?: boolean;
  t: TranslateFn;
  onChange?(value: string): void;
  onRemove(): void;
}

const TextJoinInput = forwardRef<Validatable, TextJoinInputProps>(
  ({ index, value, t, removable, onChange, onRemove }, ref) => {
    const initialValues = useRef({ text: value });
    const [form] = Form.useForm();

    useImperativeHandle(
      ref,
      () => {
        return {
          validate() {
            return form.validateFields().then(
              () => true,
              () => false
            );
          },
        };
      },
      [form]
    );

    return (
      <Form
        form={form}
        initialValues={initialValues.current}
        onFieldsChange={() => {
          onChange?.(form.getFieldValue("text"));
        }}
      >
        <div className={styles["text-item-wrapper"]}>
          <FormItem
            name="text"
            allowVariable
            label={t("indexTextLabel", `文本{index+1}`, {
              index: index + 1,
            })}
            className={styles["form-item"]}
            requiredMark={false}
            rules={[
              {
                required: true,
                message: t("emptyMessage"),
              },
            ]}
          >
            <Input
              autoComplete="off"
              placeholder={t("messagePlaceholder", "请输入")}
            />
          </FormItem>
          {removable ? (
            <Button
              type="text"
              icon={<CloseOutlined />}
              className={styles["close-btn"]}
              onClick={onRemove}
            />
          ) : null}
        </div>
      </Form>
    );
  }
);

const DataInput = forwardRef(
  ({ t, value, onChange, modelType }: InputDataProps, ref) => {
    const [form] = Form.useForm<InputDataProps>();
    const isCustom = Array.isArray(value);

    const inputs = useMemo(
      () => value?.map?.(() => createRef<Validatable>()) || [],
      [value]
    );

    useImperativeHandle(ref, () => {
      return {
        validate() {
          return Promise.all([
            ...inputs.map(
              (ref) =>
                typeof ref.current?.validate !== "function" ||
                ref.current?.validate()
            ),
            form.validateFields().then(
              () => true,
              () => false
            ),
          ]).then((results) => {
            return results.every((r) => r);
          });
        },
      };
    });

    return (
      <Form
        autoComplete="off"
        form={form}
        initialValues={
          isCustom ? { texts: value } : { variable: value, texts: [""] }
        }
        onFieldsChange={() => {
          onChange?.(
            isCustom
              ? form.getFieldValue("texts")
              : form.getFieldValue("variable")
          );
        }}
      >
        <FormItem
          required
          label={
            modelType === "embedding"
              ? t("textToEmbed", "待向量处理的文本")
              : t("textToRerank", "待排序的文本")
          }
        >
          <Radio.Group
            defaultValue={!isCustom}
            optionType="button"
            className={styles["data-input-radio-group"]}
            onChange={(e) => {
              onChange?.(
                e.target.value
                  ? form.getFieldValue("variable")
                  : form.getFieldValue("texts")
              );
            }}
          >
            <Radio value={true} className={styles["radio"]}>
              {t("selectMultipleTexts", "一次性选择多个文本")}
            </Radio>
            <Radio value={false} className={styles["radio"]}>
              {t("customSelectText", "自定义选择文本")}
            </Radio>
          </Radio.Group>
        </FormItem>

        {!isCustom && (
          <FormItem
            name="variable"
            allowVariable
            required
            label={t("selectArrayVariable", "选择数组变量")}
            style={{ marginTop: "-30px" }}
            rules={[
              {
                required: true,
                message: t("emptyMessage", "此项不能为空"),
              },
            ]}
          >
            <Input
              readOnly
              placeholder={t("selectArrayVariablePlaceholder", "请选择变量")}
            />
          </FormItem>
        )}

        {isCustom && (
          <FormItem required style={{ marginTop: "-30px" }}>
            <Form.List name="texts">
              {(fields, { add, remove }) => {
                return (
                  <div>
                    {fields.map((field, index) => (
                      <FormItem {...field} noStyle>
                        <TextJoinInput
                          ref={inputs[index]}
                          t={t}
                          index={index}
                          removable={fields.length > 1}
                          onRemove={() => remove(index)}
                        />
                      </FormItem>
                    ))}

                    <FormItem style={{ marginTop: "-8px" }}>
                      <Button
                        icon={<PlusOutlined />}
                        type="link"
                        onClick={() => add("")}
                      >
                        {t("addMoreText", "添加更多文本")}
                      </Button>
                    </FormItem>
                  </div>
                );
              }}
            </Form.List>
          </FormItem>
        )}
      </Form>
    );
  }
);

export const CommonSmallModelConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<CommonSmallModelParameters> & {
    modelType: "embedding" | "reranker";
  }
>(({ t, parameters, onChange, modelType }, ref) => {
  const [form] = Form.useForm<CommonSmallModelParameters>();
  const dataInputRef = useRef<{ validate: () => boolean }>(null);

  const { data: smallModels } = useSWR<DefaultOptionType[]>(
    "/api/mf-model-manager/v1/small-model/list?page=1&size=1000",
    async (url) => {
      try {
        const { data } = await API.axios.get(url);
        if (Array.isArray(data?.data)) {
          return data.data.map((item: any) => ({
            label: item.model_name,
            value: item.model_name,
            model_type: item.model_type,
          }));
        }
      } catch (e) {}

      return [];
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // 过滤出模型
  const filterModelOptions = useMemo(
    () =>
      smallModels?.filter((item: any) => item.model_type === modelType) || [],
    [smallModels, modelType]
  );

  useImperativeHandle(ref, () => {
    return {
      validate() {
        return Promise.all([
          dataInputRef.current?.validate?.() ?? true,
          form.validateFields().then(
            () => true,
            () => false
          ),
        ]).then((results) => {
          return results.every((r) => r);
        });
      },
    };
  });

  useLayoutEffect(() => {
    form.setFieldsValue(parameters);
  }, [form, parameters]);

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
      initialValues={parameters}
      onFieldsChange={() => {
        onChange(form.getFieldsValue());
      }}
    >
      <FormItem
        name="model"
        label={
          modelType === "embedding"
            ? t("embeddingModel", "Embedding模型")
            : t("rerankerModel", "Reranker模型")
        }
        rules={[
          {
            required: true,
            message: t("emptyMessage", "此项不能为空"),
          },
        ]}
      >
        <Select
          options={filterModelOptions}
          placeholder={t("modelPlaceholder", "请选择")}
        />
      </FormItem>

      {modelType === "reranker" && parameters?.model && (
        <FormItem
          required
          label="query"
          name="query"
          rules={[
            {
              transform(value) {
                return value?.trim();
              },
              required: true,
              message: t("emptyMessage"),
            },
          ]}
        >
          <EditorWithMentions
            parameters={(parameters as RerankerParameters).query}
            itemName="query"
          />
        </FormItem>
      )}

      {parameters?.model && (
        <FormItem
          name={modelType === "embedding" ? "input" : "documents"}
          label=""
        >
          <DataInput t={t} ref={dataInputRef} modelType={modelType} />
        </FormItem>
      )}
    </Form>
  );
});
