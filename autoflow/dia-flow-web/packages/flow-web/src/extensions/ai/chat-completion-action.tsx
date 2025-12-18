import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useState,
  useMemo,
  createRef,
} from "react";
import { Form, Input, Select, Button, Radio, Tooltip, Switch } from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import clsx from "clsx";
import {
  ExecutorAction,
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import ChatCompletionSVG from "./assets/chat-completion.svg";
import useSWR from "swr";
import { API, AsFileSelect, TranslateFn } from "@applet/common";
import { DefaultOptionType } from "antd/lib/select";
import { FormItem } from "../../components/editor/form-item";
import ModelSettingsPopover, { ModelSettings } from "./settings-popover";
import EditorWithMentions from "./editor-with-mentions";
import styles from "./chat-completion-action.module.less";

enum SourceTypeEnum {
  Docid = "docid",
  Url = "url",
}

enum MediaTypeEnum {
  Video = "video",
  Image = "image",
}

interface Attachement {
  source_type: SourceTypeEnum;
  docid?: string;
  version?: string;
  url?: string;
  media_type: MediaTypeEnum;
}

export interface ChatCompletionParameters {
  model: string;
  system_message: string;
  user_message: string;
  attachements?: Attachement[];
}

// 支持的文件扩展名
const supportExtensions = {
  image: [
    "jpg",
    "jpeg",
    "apng",
    "png",
    "gif",
    "webp",
    "bmp",
    "tiff",
    "tif",
    "ico",
    "dib",
    "icns",
    "sgi",
    "j2c",
    "j2k",
    "jp2",
    "jpc",
    "jpf",
    "jpx",
  ],
  video: ["mp4", "avi", "mkv", "mov", "flv", "wmv"],
};
const displayExtensions = {
  image: supportExtensions.image.map((item) => `.${item}`).join(", "),
  video: supportExtensions.video.map((item) => `.${item}`).join(", "),
};

interface AttachementInputProps {
  value?: Attachement;
  t: TranslateFn;
  index: number;
  videoAttachmentIndex: number;
  onChange?(value: Attachement): void;
  onRemove(): void;
}

const AttachementInput = forwardRef<Validatable, AttachementInputProps>(
  ({ value, index, t, onChange, onRemove, videoAttachmentIndex }, ref) => {
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

    const fileTypeRadioOptions = useMemo(() => {
      const videoOptionDisabled =
        videoAttachmentIndex !== -1 && index !== videoAttachmentIndex; // 只允许一个附件选择视频类文件
      const videoOption = {
        value: MediaTypeEnum.Video,
        label: t("video", "视频类"),
        description: t(
          "formatSupport",
          `支持 ${displayExtensions.video} 格式`,
          {
            displayExtensions: displayExtensions.video,
          }
        ),
        showDescriptionTooltip: !videoOptionDisabled,
        tooltip: videoOptionDisabled
          ? t("videoOnlySupportOne", "视觉模型只支持选择一个视频文件")
          : "",
        disabled: videoOptionDisabled,
      };
      return [
        {
          value: MediaTypeEnum.Image,
          label: t("image", "图片类"),
          description: t(
            "formatSupport",
            `支持 ${displayExtensions.image} 格式`,
            { displayExtensions: displayExtensions.image }
          ),
          showDescriptionTooltip: true,
        },
        videoOption,
      ];
    }, [t, index, videoAttachmentIndex]);

    return (
      <Form
        form={form}
        initialValues={value}
        onFieldsChange={() => {
          onChange?.(form.getFieldsValue());
        }}
      >
        <div className={styles["attachement"]}>
          <FormItem className={styles["title"]}>
            {t("attachementIndex", `附件${index + 1}`, { index: index + 1 })}
          </FormItem>

          <FormItem
            label={t("mediaType", "文件类型")}
            name="media_type"
            rules={[
              {
                required: true,
                message: t("emptyMessage"),
              },
            ]}
            type="string"
          >
            <Radio.Group className={styles["media-type-radio-group"]}>
              {fileTypeRadioOptions.map((item: any) => (
                <Radio
                  value={item.value}
                  key={item.value}
                  disabled={item.disabled}
                >
                  <Tooltip title={item.tooltip}>
                    <div className={styles["media-type-radio"]}>
                      <span
                        className={clsx(styles["label"], {
                          [styles["disabled-color"]]: item.disabled,
                        })}
                      >
                        {item.label}
                      </span>
                      <Tooltip
                        title={
                          item.showDescriptionTooltip ? item.description : ""
                        }
                      >
                        <div
                          className={clsx(styles["description"], {
                            [styles["disabled-color"]]: item.disabled,
                          })}
                        >
                          {item.description}
                        </div>
                      </Tooltip>
                    </div>
                  </Tooltip>
                </Radio>
              ))}
            </Radio.Group>
          </FormItem>

          {value?.source_type === SourceTypeEnum.Docid && (
            <FormItem
              label={t("extractFile", "文件")}
              name="docid"
              allowVariable
              type="asFile"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage", "此项不能为空"),
                },
              ]}
            >
              <AsFileSelect
                title={t("fileSelectTitle")}
                multiple={false}
                omitUnavailableItem
                selectType={1}
                placeholder={t("imagePlaceholder", "请选择")}
                selectButtonText={t("select")}
                supportExtensions={
                  value?.media_type === MediaTypeEnum.Image
                    ? supportExtensions.image
                    : supportExtensions.video
                }
              />
            </FormItem>
          )}

          {value?.source_type === SourceTypeEnum.Url && (
            <FormItem
              label="URL"
              name="url"
              allowVariable
              type="string"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage", "此项不能为空"),
                },
              ]}
            >
              <Input
                placeholder={
                  value?.media_type === MediaTypeEnum.Image
                    ? t(
                        "imageUrlPlaceholder",
                        "请输入URL，示例：https://www.example.com/123.jpg"
                      )
                    : t(
                        "videoUrlPlaceholder",
                        "请输入URL，示例：https://www.example.com/123.mp4"
                      )
                }
              />
            </FormItem>
          )}

          <FormItem name="source_type" style={{ marginTop: "-18px" }}>
            <Switch
              className={styles["switch"]}
              size="small"
              defaultChecked={value?.source_type === SourceTypeEnum.Url}
              onChange={(checked) => {
                form.setFieldValue(
                  "source_type",
                  checked ? SourceTypeEnum.Url : SourceTypeEnum.Docid
                );

                onChange?.(form.getFieldsValue());
              }}
            />
            <div className={styles["switch-label"]}>
              {t("urlSwitchLabel", "通过 URL 地址选择文件")}
            </div>
          </FormItem>

          {value?.source_type === SourceTypeEnum.Docid && (
            <FormItem
              label={t("version", "文件版本")}
              name="version"
              allowVariable
              type="string"
            >
              <Input
                placeholder={t(
                  "versionPlaceholder",
                  "请输入文件版本，默认获取所选文件的最新版本"
                )}
              />
            </FormItem>
          )}

          <CloseOutlined
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              fontSize: 16,
              color: "rgba(0, 0, 0)",
            }}
            onClick={onRemove}
          />
        </div>
      </Form>
    );
  }
);

export const ChatCompletionConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<ChatCompletionParameters>
>(
  (
    {
      t,
      parameters = {
        model: undefined,
        system_message: "",
        user_message: "",
      },
      onChange,
    },
    ref
  ) => {
    const [form] = Form.useForm<ChatCompletionParameters>();
    const initialSettings = {
      temperature: 1,
      top_p: 1,
      max_tokens: 1000,
      top_k: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
    const [settings, setSettings] = useState<ModelSettings>({
      ...initialSettings,
      ...parameters,
    });
    const { data: modelOptions } = useSWR<DefaultOptionType[]>(
      "/api/mf-model-manager/v1/llm/list?page=1&size=1000",
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

    // 选择的模型信息，包含model_type
    const selectedModel = useMemo(() => {
      if (!parameters?.model) return undefined;
      return modelOptions?.find((item) => item.value === parameters?.model);
    }, [modelOptions, parameters?.model]);

    const attachementInputs = useMemo(
      () => parameters.attachements?.map(() => createRef<Validatable>()),
      [parameters.attachements]
    );

    // 附件中视频类文件类型的index
    const videoAttachmentIndex = useMemo(() => {
      if (!parameters?.attachements) return -1;
      return parameters.attachements.findIndex(
        (item) => item.media_type === MediaTypeEnum.Video
      );
    }, [parameters?.attachements]);

    useImperativeHandle(ref, () => {
      return {
        validate() {
          return Promise.all([
            ...(attachementInputs || []).map(
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

    useLayoutEffect(() => {
      form.setFieldsValue(parameters);
    }, [form, parameters]);

    const handleModelSettingsUpdate = (settings: ModelSettings) => {
      setSettings(settings);
      onChange({ ...form.getFieldsValue(), ...settings });
    };

    const textAreaContent = (data: any, itemName: string) => {
      form.setFieldValue(itemName, data);
    };

    return (
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={parameters}
        onFieldsChange={() => {
          // 延迟更新，让attachments的删除操作先完成
          setTimeout(() => {
            onChange({ ...settings, ...form.getFieldsValue() });
          }, 0);
        }}
      >
        <FormItem noStyle>
          <FormItem
            label={t("model", "模型")}
            name="model"
            rules={[
              {
                required: true,
                message: t("emptyMessage"),
              },
            ]}
            style={{ width: "416px", display: "inline-block" }}
          >
            <Select
              options={modelOptions}
              placeholder={t("modelPlaceholder", "请选择")}
            />
          </FormItem>
          <ModelSettingsPopover
            t={t}
            initialSettings={settings}
            onSettingsChange={(settings) => handleModelSettingsUpdate(settings)}
          >
            <SettingOutlined
              className="dip-c-subtext"
              style={{ fontSize: "16px", margin: "34px 0 0 12px" }}
            />
          </ModelSettingsPopover>
        </FormItem>
        <FormItem
          required
          label={t("system_message", "系统提示词")}
          name="system_message"
          // allowVariable
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
          {/* <Input.TextArea
            rows={5}
            placeholder={t("messagePlaceholder", "请输入")}
          /> */}
          <EditorWithMentions
            onChange={textAreaContent}
            parameters={parameters?.system_message}
            itemName="system_message"
          />
        </FormItem>
        <FormItem
          label={t("user_message", "用户提示词")}
          name="user_message"
          // allowVariable
        >
          <EditorWithMentions
            onChange={textAreaContent}
            parameters={parameters?.user_message}
            itemName="user_message"
          />
          {/* <Input.TextArea
            rows={5}
            placeholder={t("messagePlaceholder", "请输入")}
          /> */}
        </FormItem>

        {/* 当选择视觉模型时，增加 attachments 参数 */}
        {selectedModel?.model_type === "vu" && (
          <FormItem label={t("attachments", "附件")}>
            <Form.List name="attachements">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field: any, index) => {
                    return (
                      <FormItem {...field} noStyle>
                        <AttachementInput
                          ref={attachementInputs?.[index]}
                          index={index}
                          t={t}
                          videoAttachmentIndex={videoAttachmentIndex}
                          onRemove={() => remove(field.name)}
                        />
                      </FormItem>
                    );
                  })}

                  <FormItem>
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        add({
                          source_type: SourceTypeEnum.Docid,
                          media_type: MediaTypeEnum.Image,
                        })
                      }
                    >
                      {t("addAttachment", "添加附件")}
                    </Button>
                  </FormItem>
                </>
              )}
            </Form.List>
          </FormItem>
        )}
      </Form>
    );
  }
);

export const ChatCompletionAction: ExecutorAction = {
  name: "EAChatCompletion",
  description: "EAChatCompletionDescription",
  operator: "@llm/chat/completion",
  icon: ChatCompletionSVG,
  outputs: [
    {
      key: ".answer",
      type: "string",
      name: "EAChatCompletionOutputAnswer",
    },
    {
      key: ".json",
      type: "object",
      name: "EACallAgentOutputAnswerJson",
    },
  ],
  components: {
    Config: ChatCompletionConfig,
  },
};
