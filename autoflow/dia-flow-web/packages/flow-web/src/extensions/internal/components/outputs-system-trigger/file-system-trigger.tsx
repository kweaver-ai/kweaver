import {
  createRef,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Checkbox, Form, Input, Select, Typography } from "antd";
import { customAlphabet } from "nanoid";
import { useParams } from "react-router-dom";
import moment from "moment";
import { isArray } from "lodash";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  API,
  MicroAppContext,
  TranslateFn,
  useFormatPermText,
} from "@applet/common";
import { HolderOutlined } from "@ant-design/icons";
import {
  AsDatetimeColored,
  AsDepartmentsColored,
  AsFileColored,
  AsFolderColored,
  AsMetadataColored,
  AsMultipleFilesColored,
  AsMultipleTextColored,
  AsNumberColored,
  AsPermColored,
  AsRadioColored,
  AsTagsColored,
  AsTextColored,
  AsUsersColored,
  AsLevelColored,
  CloseOutlined,
  PlusOutlined,
} from "@applet/icons";
import FileTriggerSVG from "../../assets/file-trigger.svg";
import {
  ExecutorAction,
  Validatable,
  TriggerActionConfigProps,
  ExecutorActionInputProps,
  ExecutorActionOutputProps,
} from "../../../../components/extension";
import styles from "./file-system-trigger.module.less";
import { AsFileSelect } from "../../../../components/as-file-select";
import { FormItem } from "../../../../components/editor/form-item";
import { MetadataLog } from "../../../../components/metadata-template";
import { useTranslateExtension } from "../../../../components/extension-provider";
import clsx from "clsx";
const { TextArea } = Input;

const nanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  16
);

interface RelatedRatioItem {
  value: string;
  related: string[];
}

interface FileTriggerParameterField {
  key: string;
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
  allowOverride?: boolean;
  data?: (RelatedRatioItem | string)[];
  result?: string;
}

interface FileTriggerParameter {
  fields: FileTriggerParameterField[];
}

// 触发器节点转换docid为docids
function transformParams(parameters: any) {
  if (parameters?.docid && !parameters?.docids) {
    return {
      ...parameters,
      docids: [parameters.docid],
      docid: undefined,
    };
  }
  return parameters;
}

function isGNSLike(value: any) {
  return typeof value === "string" && /^gns:\/(\/[0-9A-F]{32})+$/.test(value);
}

const FieldsAll: readonly { type: string; label: string; icon: JSX.Element }[] =
  [
    {
      type: "string",
      label: "fileTrigger.field.type.string",
      icon: <AsTextColored className={styles["type-icon"]} />,
    },
    {
      type: "long_string",
      label: "fileTrigger.field.type.long_string",
      icon: <AsMultipleTextColored className={styles["type-icon"]} />,
    },
    {
      type: "number",
      label: "fileTrigger.field.type.number",
      icon: <AsNumberColored className={styles["type-icon"]} />,
    },
    {
      type: "datetime",
      label: "fileTrigger.field.type.datetime",
      icon: <AsDatetimeColored className={styles["type-icon"]} />,
    },

    {
      type: "radio",
      label: "fileTrigger.field.type.radio",
      icon: <AsRadioColored className={styles["type-icon"]} />,
    },
    {
      type: "asFile",
      label: "fileTrigger.field.type.asFile",
      icon: <AsFileColored className={styles["type-icon"]} />,
    },
    {
      type: "multipleFiles",
      label: "fileTrigger.field.type.multipleFiles",
      icon: <AsMultipleFilesColored className={styles["type-icon"]} />,
    },
    {
      type: "asFolder",
      label: "fileTrigger.field.type.asFolder",
      icon: <AsFolderColored className={styles["type-icon"]} />,
    },
    {
      type: "asPerm",
      label: "fileTrigger.field.type.asPerm",
      icon: <AsPermColored className={styles["type-icon"]} />,
    },
    {
      type: "asTags",
      label: "fileTrigger.field.type.asTags",
      icon: <AsTagsColored className={styles["type-icon"]} />,
    },
    {
      type: "asMetadata",
      label: "fileTrigger.field.type.asMetadata",
      icon: <AsMetadataColored className={styles["type-icon"]} />,
    },
    {
      type: "asLevel",
      label: "fileTrigger.field.type.asLevel",
      icon: <AsLevelColored className={styles["type-icon"]} />,
    },
    {
      type: "asUsers",
      label: "fileTrigger.field.type.asUsers",
      icon: <AsUsersColored className={styles["type-icon"]} />,
    },
    {
      type: "asDepartments",
      label: "fileTrigger.field.type.asDepartments",
      icon: <AsDepartmentsColored className={styles["type-icon"]} />,
    },
  ];

export enum FileSystemType {
  /**
   * 文件
   */
  TAFile = "TAFile",

  /**
   * 文件夹
   */
  TAFolder = "TAFolder",
}

const FileSystemInfo: Record<
  FileSystemType,
  { FileSystemKey: string; fieldsRemove: readonly string[] }
> = {
  [FileSystemType.TAFile]: {
    FileSystemKey: "file",
    fieldsRemove: [
      "long_string",
      "multipleFiles",
      "asLevel",
      "asUsers",
      "asDepartments",
    ],
  },
  [FileSystemType.TAFolder]: {
    FileSystemKey: "folder",
    fieldsRemove: [],
  },
};

export const FileSystemTriggerAction = (
  fileSystemType: FileSystemType = FileSystemType.TAFile
): ExecutorAction => {
  const { FileSystemKey, fieldsRemove } = FileSystemInfo[fileSystemType];
  const FieldTypes = FieldsAll.filter(
    ({ type }) => !fieldsRemove?.includes(type)
  );

  return {
    name: fileSystemType,
    description: `${fileSystemType}Description`,
    operator: `@trigger/selected-${FileSystemKey}`,
    icon: FileTriggerSVG,
    outputs(step) {
      const defaultOutput = [
        {
          key: ".accessor",
          name: "TAFileOutputAccessor",
          type: "asUser",
        },
        {
          key: ".source.id",
          name: "TAFileOutputDoc",
          type: `as${FileSystemKey.charAt(
            0
          ).toUpperCase()}${FileSystemKey.slice(1)}`, // asFile  asFiloder
        },
        {
          key: ".source.name",
          name: "TAFileOutputDocName",
          type: "string",
        },
        {
          key: ".source.path",
          name: "TAFileOutputDocPath",
          type: "string",
        },
        {
          key: ".source.rev",
          name: "TAFileOutputDocRev",
          type: "version",
        },
        {
          key: ".source.type",
          name: "TAFileOutputDocType",
          type: "string",
        },
      ];
      if (Array.isArray(step.parameters?.fields)) {
        return [
          ...defaultOutput,
          ...step.parameters.fields.map((field: FileTriggerParameterField) => {
            let type = field.type;
            if (type === "radio") {
              type = "string";
            }
            return {
              key: `.fields.${field.key}`,
              name: field.name,
              type: type,
              isCustom: true,
            };
          }),
        ];
      }
      return defaultOutput;
    },
    validate(parameters) {
      return (
        parameters &&
        ((Array.isArray(parameters.docids) &&
          parameters.docids.length > 0 &&
          parameters.docids.every(isGNSLike)) ||
          isGNSLike(parameters.docid)) &&
        (parameters.inherit === undefined ||
          typeof parameters.inherit === "boolean")
      );
    },
    components: {
      Config: forwardRef<
        Validatable,
        TriggerActionConfigProps<FileTriggerParameter>
      >(
        (
          {
            t,
            parameters = {
              docids: undefined,
              inherit: false,
              fields: [],
            },
            onChange,
          },
          ref
        ) => {
          const [form] = Form.useForm<FileTriggerParameter>();
          const [isSelecting, setIsSelecting] = useState(false);
          const [isDragging, setIsDragging] = useState(false);
          const refs = useMemo(() => {
            return (
              parameters?.fields?.map(() => createRef<Validatable>()) || []
            );
          }, [parameters?.fields]);

          useImperativeHandle(
            ref,
            () => {
              return {
                validate() {
                  return Promise.all([
                    ...refs.map(
                      (ref: any) =>
                        typeof ref.current?.validate !== "function" ||
                        ref.current?.validate()
                    ),
                    form.validateFields().then(
                      () => true,
                      () => false
                    ),
                  ]).then((results) => results.every((r) => r));
                },
              };
            },
            [form, refs]
          );

          useEffect(() => {
            if (isDragging) {
              document.body.style.cursor = "move";
            } else {
              document.body.style.cursor = "default";
            }
            return () => {
              document.body.style.cursor = "default";
            };
          }, [isDragging]);

          return (
            <Form
              form={form}
              initialValues={transformParams(parameters)}
              layout="vertical"
              autoComplete="off"
              onFieldsChange={() => {
                if (typeof onChange === "function") {
                  onChange(form.getFieldsValue());
                }
              }}
            >
              <div className={styles["title-wrapper"]}>
                <div className={styles["title"]} />
                <span className={styles["tile-label"]}>
                  {t("fileTrigger.scope", "触发的范围")}
                </span>
              </div>
              <FormItem
                required
                // label={
                //     <div className={styles["ellipsis"]} title={t(`${fileSystemType}Trigger.source`, "允许以下文件夹内容的文件被右键触发")}>
                //         {t(`${fileSystemType}Trigger.source`, "允许以下文件夹内容的文件被右键触发")}
                //     </div>
                // }
                name="docids"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <AsFileSelect
                  title={t("folderSelectTitle", "选择文件夹")}
                  multiple
                  multipleMode="list"
                  omitUnavailableItem
                  omittedMessage={t("unavailableFoldersOmitted")}
                  selectType={2}
                  placeholder={t(
                    "fileTrigger.sourcePlaceholder",
                    "请选择文件夹"
                  )}
                  selectButtonText={t("select", "选择")}
                />
              </FormItem>
              <FormItem
                label={t("inherit")}
                name="inherit"
                valuePropName="checked"
              >
                <Checkbox>{t("inheritDescription")}</Checkbox>
              </FormItem>
              <div className={styles["title-wrapper"]}>
                <div className={styles["title"]} />
                <span className={styles["tile-label"]}>
                  {t("fileTrigger.form", "触发后表单")}
                </span>
              </div>

              <FormItem label={null} className={styles["form-list"]}>
                <Form.List
                  name="fields"
                  // rules={[
                  //     {
                  //         async validator(_, values) {
                  //             if (
                  //                 !Array.isArray(values) ||
                  //                 values.length < 1
                  //             ) {
                  //                 throw new Error(t("emptyMessage"));
                  //             }
                  //         },
                  //     },
                  // ]}
                >
                  {(fields, { add, remove, move }, { errors }) => {
                    return (
                      <>
                        <DragDropContext
                          onDragStart={() => {
                            setIsDragging(true);
                          }}
                          onDragEnd={(result) => {
                            setIsDragging(false);
                            if (!result.destination) {
                              return;
                            }

                            move(result.source.index, result.destination.index);
                          }}
                        >
                          <Droppable droppableId="form-droppable">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={styles["droppable"]}
                              >
                                {fields.map((field, index) => {
                                  return (
                                    <FormItem {...field}>
                                      <FieldInput
                                        t={t}
                                        ref={refs[index]}
                                        index={index}
                                        fieldTypes={FieldTypes}
                                        onClose={() => remove(index)}
                                        fields={parameters.fields}
                                      />
                                    </FormItem>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                        {fields.length === 0 && !isSelecting && (
                          <div className={styles["description"]}>
                            {t(
                              "fileTrigger.form.description",
                              "若您想在选择文件之后，弹出表单录入数据，则需要添加问题"
                            )}
                          </div>
                        )}
                        <Form.ErrorList errors={errors} />
                        {!isSelecting && (
                          <Button
                            type="link"
                            icon={
                              <PlusOutlined className={styles["add-icon"]} />
                            }
                            className={styles["link-btn"]}
                            onClick={() => setIsSelecting(true)}
                          >
                            {t("fileTrigger.add", "添加问题")}
                          </Button>
                        )}
                      </>
                    );
                  }}
                </Form.List>
              </FormItem>
            </Form>
          );
        }
      ),
      FormattedInput: ({ t, input }: ExecutorActionInputProps) => {
        return (
          <table>
            <tbody>
              <tr>
                <td className={styles.label}>
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 2,
                    }}
                    className="applet-table-label"
                    title={t(`${fileSystemType}Trigger.source`) + t("id")}
                  >
                    {t(`${fileSystemType}Trigger.source`) + t("id")}
                  </Typography.Paragraph>
                  {t("colon")}
                </td>
                <td>{input?.docid}</td>
              </tr>
              <tr>
                <td className={styles.label}>{t("inherit") + t("colon")}</td>
                <td>
                  {typeof input?.inherit === "boolean"
                    ? t(`required.${input.inherit}`)
                    : t("required.false")}
                </td>
              </tr>
              {input?.fields?.map(
                (item: FileTriggerParameterField, index: number) => (
                  <>
                    <tr>
                      <td style={{ paddingTop: "12px" }}>
                        {t("fileTrigger.item", {
                          index: index + 1,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>
                        {t("fileTrigger.field.type")}
                        {t("colon", "：")}
                      </td>
                      <td>{t(`fileTrigger.field.type.${item.type}`, "")}</td>
                    </tr>
                    <tr>
                      <td className={styles.label}>
                        {t("fileTrigger.field.name")}
                        {t("colon", "：")}
                      </td>
                      <td>{item.name}</td>
                    </tr>
                    <tr>
                      <td className={styles.label}>
                        {t("fileTrigger.required")}
                        {t("colon", "：")}
                      </td>
                      <td>
                        {typeof item.required === "boolean"
                          ? t(`required.${item.required}`)
                          : t("required.false")}
                      </td>
                    </tr>
                  </>
                )
              )}
            </tbody>
          </table>
        );
      },
      FormattedOutput: ({ t, outputData }: ExecutorActionOutputProps) => {
        const [formFields, setFields] = useState<FileTriggerParameterField[]>(
          []
        );
        const formatPermText = useFormatPermText();
        const te = useTranslateExtension("anyshare");

        const { id: taskId = "" } = useParams();
        const accessor = useMemo(() => {
          let val = outputData?.accessor?.name || "";
          try {
            val = JSON.parse(outputData?.accessor).name;
          } catch (error) {
            console.warn(error);
          }
          return val;
        }, [outputData?.accessor]);

        const getValue = (field: FileTriggerParameterField) => {
          const value = outputData.fields[field.key];
          if (!value) {
            return "---";
          }
          try {
            switch (field.type) {
              case "string":
              case "long_string":
              case "radio":
              case "number":
              case "asFile":
              case "asFolder":
                return value || "---";
              case "multipleFiles":
                return value?.map((item: string) => <div>{item}</div>);
              case "datetime":
                if (typeof value === "string") {
                  return moment(value).format("YYYY/MM/DD HH:mm");
                }
                if (!value || value === -1) {
                  return "---";
                }
                return value;
              case "asPerm": {
                const val = JSON.parse(value);
                return formatPermText(val);
              }
              case "asTags": {
                return value?.join("，");
              }
              case "asUsers":
              case "asDepartments": {
                if (isArray(value)) {
                  return value.map((i: any) => i.name).join("，");
                }
                try {
                  const arr = JSON.parse(value);
                  return arr.map((i: any) => i.name).join("，");
                } catch (error) {
                  return JSON.stringify(value);
                }
              }
              default:
                return JSON.stringify(value);
            }
          } catch (error) {
            return JSON.stringify(value);
          }
        };

        useEffect(() => {
          async function getFields() {
            try {
              const { data } = await API.automation.dagDagIdGet(taskId);
              setFields(
                (data?.steps[0]?.parameters as Record<string, any>)?.fields
              );
            } catch (error) {
              console.error(error);
            }
          }
          getFields();
        }, []);

        return (
          <table>
            <tbody>
              <tr>
                <td className={styles.label}>
                  {t("TAFileOutputAccessor", "执行者")}
                  {t("colon", "：")}
                </td>
                <td>{accessor}</td>
              </tr>
              <tr>
                <td className={styles.label}>
                  {t("TAFileOutputDoc", "发起内容")}
                  {t("colon", "：")}
                </td>
                <td>{outputData?.source.id}</td>
              </tr>
              <tr>
                <td className={styles.label}>
                  {t("TAFileOutputDocName", "发起内容名称")}
                  {t("colon", "：")}
                </td>
                <td>{outputData?.source.name}</td>
              </tr>
              {formFields?.map((field: FileTriggerParameterField) => {
                const fieldValue = getValue(field);
                if (field.type === "asMetadata") {
                  return <MetadataLog t={te} templates={outputData} />;
                }
                return (
                  <tr>
                    <td className={styles.label}>
                      <Typography.Paragraph
                        ellipsis={{
                          rows: 2,
                        }}
                        className="applet-table-label"
                        title={field?.name}
                      >
                        {field?.name}
                      </Typography.Paragraph>
                      {t("colon", "：")}
                    </td>
                    <td>
                      {typeof fieldValue === "string"
                        ? fieldValue
                        : JSON.stringify(fieldValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      },
    },
  };
};

interface FieldInputProps {
  t: TranslateFn;
  value?: FileTriggerParameterField;
  index: number;
  fieldTypes: typeof FieldsAll;
  fields: FileTriggerParameterField[];
  onClose(): void;
  onChange?(value: FileTriggerParameterField): void;
}

let isShowingRelatedRemovedToast = false;
let isShowingRelatedMissingToast = false;

export const FieldInput = forwardRef<Validatable, FieldInputProps>(
  (
    { t, value, index, onChange, onClose, fieldTypes, fields: allFields },
    ref
  ) => {
    const { message, modal } = useContext(MicroAppContext);
    const [form] = Form.useForm<FileTriggerParameterField>();
    const [isFocus, setIsFocus] = useState(false);
    const inputRef = useRef<any>(null);
    const initialValues = {
      description: { type: "text" },
      ...value,
    };

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

    useEffect(() => {
      setIsFocus(false);
      inputRef.current?.blur();
    }, [index]);

    const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
      if (isDragging && draggableStyle?.transform) {
        const translateY = parseFloat(
          draggableStyle.transform.split("(")[1].split(",")[1]
        );
        const width = parseFloat(draggableStyle.width);
        return {
          userSelect: "none",
          cursor: "move",
          background: "#fff",
          borderBottom: "none",
          boxShadow: "0 2px 9px 1px rgba(0, 0, 0, 0.1)",
          margin: "0 -32px",
          padding: "48px 32px 16px",

          ...draggableStyle,
          transform: `translate(${0}px,${translateY}px)`,
          width: `${width + 64}px`,
        };
      }
      return {
        userSelect: "none",
        cursor: isDragging ? "move" : "default",
        background: "#fff",

        // styles need to apply on draggables
        ...draggableStyle,
      };
    };

    useEffect(() => {
      if (value?.type === "radio" && value.data) {
        const prevQuestionKeySet = new Set(
          allFields.slice(0, index).map((field) => field.key)
        );
        const postQuestionKeySet = new Set(
          allFields.slice(index + 1).map((field) => field.key)
        );

        let hasMissingRelated = false;
        let hasRemovedRelated = false;

        const radioData = [];

        for (const item of value.data) {
          if (
            isRelatedRatio(item) &&
            item.related.some((key) => !postQuestionKeySet.has(key))
          ) {
            radioData.push({
              value: item.value,
              related: item.related.filter((key) => {
                const keep = postQuestionKeySet.has(key);
                if (
                  !hasRemovedRelated &&
                  !keep &&
                  !prevQuestionKeySet.has(key)
                ) {
                  hasRemovedRelated = true;
                }
                return keep;
              }),
            });
            hasMissingRelated = true;
            continue;
          }
          radioData.push(item);
        }

        if (hasMissingRelated) {
          if (hasRemovedRelated) {
            if (!isShowingRelatedRemovedToast) {
              isShowingRelatedRemovedToast = true;
              message.info(
                t(
                  "fileTrigger.hasRemovedRelatedToast",
                  "删除后，此问题项的关联关系已失效"
                ),
                undefined,
                () => {
                  isShowingRelatedRemovedToast = false;
                }
              );
            }
          } else {
            if (!isShowingRelatedMissingToast) {
              isShowingRelatedMissingToast = true;
              message.info(
                t(
                  "fileTrigger.hasMissingRelatedToast",
                  "调整顺序后，此问题项的关联关系已失效"
                ),
                undefined,
                () => {
                  isShowingRelatedRemovedToast = false;
                }
              );
            }
          }
          form.setFieldValue("data", radioData);
          onChange?.(form.getFieldsValue());
        }
      }
    }, [allFields]);

    return (
      <Draggable key={index} draggableId={String(index)} index={index}>
        {(provided, snapshot) => (
          <div
            className={clsx(styles["fieldInput"], {
              [styles["isDragging"]]: snapshot.isDragging,
            })}
            key={index}
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={getItemStyle(
              snapshot.isDragging,
              provided.draggableProps.style
            )}
          >
            <span
              {...provided.dragHandleProps}
              className={clsx(styles["draggle-icon"], {
                [styles["visible"]]: isFocus === true,
              })}
            >
              <HolderOutlined style={{ fontSize: "13px" }} />
            </span>
            <span className={styles["fieldIndex"]}>
              {t("fileTrigger.item", "输出参数")}
              {index + 1}
            </span>
            <CloseOutlined className={styles.removeButton} onClick={onClose} />
            <Form
              form={form}
              initialValues={initialValues}
              autoComplete="off"
              layout="inline"
              onFocus={() => {
                setIsFocus(true);
              }}
              onBlur={() => {
                setIsFocus(false);
              }}
              onFieldsChange={async () => {
                await onChange?.({ ...form.getFieldsValue() });
              }}
            >
              <FormItem name="type" label="参数类型" required>
                <Select virtual={false} className={styles["select"]}>
                  {fieldTypes.map((field) => (
                    <Select.Option key={field.type}>
                      <div className={styles["select-item"]}>
                        <Typography.Text ellipsis title={t(field.label)}>
                          {t(field.label)}
                        </Typography.Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                name="key"
                label="参数名称"
                rules={[
                  {
                    required: true,
                    message: "请输入参数名称!",
                  },
                  {
                    type: "string",
                    pattern: /^[a-zA-Z]+(_?[a-zA-Z]+)*$/,
                    message: "参数名称只能包含字母和下划线，且必须以字母开头!",
                  },
                  // {
                  //     min: 2,
                  //     max: 10,
                  //     message: '参数名称长度必须在 2 到 10 个字符之间!',
                  // },
                ]}
              >
                <Input placeholder={t("input.placeholder", "请输入")} />
              </FormItem>
              <FormItem name="value" label="参数值" allowVariable>
                <TextArea
                  placeholder={t("input.placeholder", "请输入")}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
              </FormItem>
              <FormItem name="name" label="显示名称">
                <Input placeholder={t("input.placeholder", "请输入")} />
              </FormItem>
              <FormItem name={["description", "text"]} label="参数说明">
                <Input placeholder={t("input.placeholder", "请输入")} />
              </FormItem>
              <FormItem name={["description", "type"]} hidden>
                <Input value="text" defaultValue="text" />
              </FormItem>
              {/* <div className={styles["required-wrapper"]}>
                            <FormItem name="required" valuePropName="checked" noStyle>
                                <Checkbox>{t("fileTrigger.required","必填")}</Checkbox>
                            </FormItem>
                        </div> */}
            </Form>
          </div>
        )}
      </Draggable>
    );
  }
);

export function isRelatedRatio(
  value?: RelatedRatioItem | string
): value is RelatedRatioItem {
  return Boolean(value && typeof value === "object");
}

export const FolderTriggerAction = FileSystemTriggerAction(
  FileSystemType.TAFolder
);
export const FileTriggerAction = FileSystemTriggerAction(FileSystemType.TAFile);
