import {
  ExecutorActionConfigProps,
  ExecutorActionInputProps,
  Validatable,
} from "../../components/extension";
import FileSVG from "./assets/file.svg";
import {
  ForwardedRef,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Form, Input, Radio, Select, Typography } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";
import styles from "./index.module.less";
import { TableRowSelect } from "./components/table-row-select";
import { EditorContext } from "../../components/editor/editor-context";
import { TriggerStepNode } from "../../components/editor/expr";
import { isGNSLike, isVariableLike } from ".";

function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => {
    return {
      validate() {
        return form.validateFields().then(
          () => true,
          () => false
        );
      },
    };
  });

  useLayoutEffect(() => {
    form.setFieldsValue(parameters);
  }, [form, parameters]);

  return form;
}

export const FileCreate = [
  {
    name: "EAFileCreate",
    description: "EAFileCreateDescription",
    operator: "@anyshare/file/create",
    group: "file",
    icon: FileSVG,
    outputs: [
      {
        key: ".docid",
        type: "asFile",
        name: "EAFileCreateOutputDocid",
      },
      {
        key: ".name",
        type: "string",
        name: "EAFileCreateOutputName",
      },
      // {
      //     key: ".size",
      //     type: "number",
      //     name: "EAFileCreateOutputSize",
      // },
      {
        key: ".path",
        type: "string",
        name: "EAFileCreateOutputPath",
      },
      {
        key: ".create_time",
        type: "datetime",
        name: "EAFileCreateOutputCreateTime",
      },
      {
        key: ".creator",
        type: "string",
        name: "EAFileCreateOutputCreator",
      },
      {
        key: ".modify_time",
        type: "datetime",
        name: "EAFileCreateOutputModificationTime",
      },
      {
        key: ".editor",
        type: "string",
        name: "EAFileCreateOutputModifiedBy",
      },
    ],
    validate(parameters: any) {
      return (
        parameters &&
        (isVariableLike(parameters.docid) || isGNSLike(parameters.docid)) &&
        (isVariableLike(parameters.name) ||
          (typeof parameters.name === "string" &&
            /^[^#\\/:*?"<>|]{0,255}$/.test(parameters.name))) &&
        [1, 2, 3].includes(parameters.ondup)
      );
    },
    components: {
      Config: forwardRef(
        ({ t, parameters, onChange }: ExecutorActionConfigProps, ref: any) => {
          const form = useConfigForm(parameters, ref);
          const { stepNodes } = useContext(EditorContext);
          const initialValues = {
            ...parameters,
            type: parameters?.type || "docx",
          };
          const showTip = useMemo(() => {
            if (
              stepNodes[0] &&
              (stepNodes[0] as TriggerStepNode).step.operator ===
                "@anyshare-trigger/upload-file"
            ) {
              return true;
            }
            return false;
          }, [stepNodes]);

          return (
            <Form
              form={form}
              layout="vertical"
              initialValues={initialValues}
              onFieldsChange={(changedFields) => {
                const typeFieldChanged = changedFields.some(
                  (field:any) => field.name[0] === "type"
                );
                if (typeFieldChanged) {
                  const allFields = form.getFieldsValue();
                   form.setFieldsValue({
                      type: allFields.type,
                      name: undefined,
                      ondup: undefined,
                      docid: undefined,
                      content: undefined,
                    });
                } 
                onChange(form.getFieldsValue());
              }}
            >
              <FormItem
                required
                label={t("fileCreate.type")}
                name="type"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value={"docx"}>{t("fileCreate.docx")}</Radio>
                  <Radio value={"xlsx"}>{t("fileCreate.xlsx")}</Radio>
                  <Radio value={"pdf"}>PDF</Radio>
                  <Radio value={"md"}>Markdown</Radio>
                </Radio.Group>
              </FormItem>
              <FormItem
                required
                label={t("fileCreate.name")}
                name="name"
                allowVariable
                type="string"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                  {
                    pattern: /^[^#\\/:*?"<>|]{0,255}$/,
                    message: t("invalidFileName"),
                  },
                ]}
              >
                <Input
                  autoComplete="off"
                  placeholder={t("fileCreate.namePlaceholder")}
                />
              </FormItem>
              {parameters?.type === "pdf" ? (
                <FormItem
                  required
                  name="source_type"
                  label="文本来源"
                  allowVariable={false}
                  rules={[
                    {
                      required: true,
                      message: t("emptyMessage"),
                    },
                  ]}
                  initialValue="full_text"
                >
                  <Select
                    placeholder={t("ondup.filePlaceholder")}
                    defaultValue="full_text"
                  >
                    <Select.Option key={1} value="full_text">
                      文本内容
                    </Select.Option>
                    <Select.Option key={2} value="url">
                      文件下载地址
                    </Select.Option>
                  </Select>
                </FormItem>
              ) : (
                <FormItem
                  required
                  name="source_type"
                  label="文本来源"
                  allowVariable={false}
                  rules={[
                    {
                      required: true,
                      message: t("emptyMessage"),
                    },
                  ]}
                  initialValue="full_text"
                  hidden={true}
                >
                  <Select
                    placeholder={t("ondup.filePlaceholder")}
                    defaultValue="full_text"
                  >
                    <Select.Option key={1} value="full_text">
                      文本内容
                    </Select.Option>
                  </Select>
                </FormItem>
              )}
              {parameters?.type === "xlsx" && (
                <FormItem
                  required
                  label="新增表格内容的方式"
                  name="new_type"
                  initialValue="new_row"
                  rules={[
                    {
                      required: true,
                      message: t("emptyMessage"),
                    },
                  ]}
                >
                  <Radio.Group>
                    <Radio value={"new_row"}>新增行</Radio>
                    <Radio value={"new_col"}>新增列</Radio>
                  </Radio.Group>
                </FormItem>
              )}
              <FormItem
                required
                label={
                  parameters?.type === "xlsx"
                    ? "表格内容"
                    : t("fileCreate.content")
                }
                name="content"
                allowVariable
                type={parameters?.type === "xlsx" ? "array" : "string"}
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <Input
                  autoComplete="off"
                  placeholder={
                    parameters?.type === "xlsx"
                      ? "仅支持选择数组类型的变量"
                      : t("fileCreate.namePlaceholder")
                  }
                  readOnly={parameters?.type === "xlsx"}
                />
              </FormItem>

              <FormItem
                required
                label={t("fileCreate.source")}
                name="docid"
                allowVariable
                type="asFolder"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <AsFileSelect
                  title={t("fileSelectTitle")}
                  multiple={false}
                  omitUnavailableItem
                  selectType={2}
                  placeholder={t("fileCreate.sourcePlaceholder")}
                  selectButtonText={t("select")}
                  tip={
                    showTip
                      ? t(
                          "tip.sameFolder",
                          "请确认目标文件夹与触发器所选文件夹不能是同一个"
                        )
                      : undefined
                  }
                />
              </FormItem>
              <FormItem
                required
                name="ondup"
                label={t("ondup.file")}
                allowVariable={false}
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <Select placeholder={t("ondup.filePlaceholder")}>
                  <Select.Option key={1} value={1}>
                    {t("ondup.throw")}
                  </Select.Option>
                  <Select.Option key={2} value={2}>
                    <span>
                      {t("ondup.rename")}
                      &nbsp;
                      <span className={styles.selectOptionDescription}>
                        {t("ondup.renameDescription")}
                      </span>
                    </span>
                  </Select.Option>
                  <Select.Option key={3} value={3}>
                    {t("ondup.overwrite")}
                  </Select.Option>
                </Select>
              </FormItem>
            </Form>
          );
        }
      ),
      FormattedInput: ({ t, input }: ExecutorActionInputProps) => (
        <table>
          <tbody>
            {Object.keys(input).map((item) => {
              let label;
              let value = input[item];
              switch (item) {
                case "type":
                  label = t("fileCreate.type");
                  value = t(`fileCreate.${value}`);
                  break;
                case "docid":
                  label =
                    t("fileCreate.source", "要重命名的文件") + t("id", "ID");
                  break;
                case "name":
                  label = t("fileCreate.name", "新的文件名称");
                  break;
                case "ondup":
                  label = t("ondup.file", "如果文件存在");
                  input[item] === 1
                    ? (value = t("ondup.throw", "运行时抛出异常"))
                    : input[item] === 2
                    ? (value = t("ondup.rename", "自动重命名"))
                    : (value = t("ondup.overwrite", "自动覆盖"));
                  break;
                default:
                  label = "";
              }
              if (label) {
                return (
                  <tr>
                    <td className={styles.label}>
                      <Typography.Paragraph
                        ellipsis={{
                          rows: 2,
                        }}
                        className="applet-table-label"
                        title={label}
                      >
                        {label}
                      </Typography.Paragraph>
                      {t("colon", "：")}
                    </td>
                    <td>{value}</td>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
      ),
    },
  },
  // 更新docx文件
  {
    name: "EAFileEditDoc",
    description: "EAFileEditDocDescription",
    operator: "@anyshare/file/edit",
    group: "file",
    icon: FileSVG,
    outputs: [
      {
        key: ".docid",
        type: "asFile",
        name: "EAFileEditDocOutputFile",
      },
      {
        key: ".name",
        type: "string",
        name: "EAFileCreateOutputName",
      },
      {
        key: ".path",
        type: "string",
        name: "EAFileCreateOutputPath",
      },
      {
        key: ".create_time",
        type: "datetime",
        name: "EAFileCreateOutputCreateTime",
      },
      {
        key: ".creator",
        type: "string",
        name: "EAFileCreateOutputCreator",
      },
      {
        key: ".modify_time",
        type: "datetime",
        name: "EAFileCreateOutputModificationTime",
      },
      {
        key: ".editor",
        type: "string",
        name: "EAFileCreateOutputModifiedBy",
      },
    ],
    validate(parameters: any) {
      return (
        parameters &&
        (isVariableLike(parameters.docid) || isGNSLike(parameters.docid))
      );
    },
    components: {
      Config: forwardRef(
        ({ t, parameters, onChange }: ExecutorActionConfigProps, ref: any) => {
          const form = useConfigForm(parameters, ref);
          const typeRef = useRef<Validatable>(null);

          const transferParameter = useMemo(() => {
            return {
              ...parameters,
              type: parameters?.type || "docx",
              type_xlsx: parameters?.new_type
                ? {
                    new_type: parameters.new_type,
                    insert_type: parameters.insert_type,
                    insert_pos: parameters.insert_pos,
                  }
                : undefined,
            };
          }, [parameters]);

          const supportExtensions = () => {
            const type = parameters?.type;
            switch (type) {
              case "xlsx":
                return [".xlsx", "xls"];
              case "md":
                return [".md"];
              default:
                return [".docx"];
            }
          };

          return (
            <Form
              form={form}
              layout="vertical"
              initialValues={transferParameter}
              autoComplete="off"
              onFieldsChange={() => {
                const val = form.getFieldsValue();
                onChange({
                  docid: val?.docid,
                  content: val?.content,
                  type: val?.type,
                  new_type: val?.type_xlsx?.new_type,
                  insert_type:
                    val?.type === "xlsx"
                      ? val?.type_xlsx?.insert_type
                      : val?.insert_type,
                  insert_pos: val?.type_xlsx?.insert_pos,
                });
              }}
            >
              <FormItem
                required
                label="更新的文件类型"
                name="type"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value={"docx"}>{t("fileCreate.docx")}</Radio>
                  <Radio value={"xlsx"}>{t("fileCreate.xlsx")}</Radio>
                  <Radio value={"md"}>Markdown</Radio>
                </Radio.Group>
              </FormItem>
              <FormItem
                required
                label={t("fileEditDoc.source")}
                name="docid"
                allowVariable
                type="asFile"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <AsFileSelect
                  title={t("fileSelectTitle")}
                  multiple={false}
                  omitUnavailableItem
                  selectType={1}
                  supportExtensions={supportExtensions()}
                  notSupportTip={t("fileEditDoc.tip", {
                    name: parameters?.type || "docx",
                  })}
                  placeholder={t("fileEditDoc.sourcePlaceholder")}
                  selectButtonText={t("select")}
                />
              </FormItem>
              {parameters?.type === "xlsx" ? (
                <FormItem
                  required
                  label={t("fileEditDoc.insert_type")}
                  name="type_xlsx"
                  rules={[
                    {
                      required: true,
                      message: t("emptyMessage"),
                    },
                  ]}
                >
                  <TableRowSelect ref={typeRef} t={t} />
                </FormItem>
              ) : (
                <FormItem
                  required
                  label={t("fileEditDoc.insert_type")}
                  name="insert_type"
                  rules={[
                    {
                      required: true,
                      message: t("emptyMessage"),
                    },
                  ]}
                >
                  <Select placeholder={t("fileEditDoc.typePlaceholder")}>
                    <Select.Option value={"append"}>
                      <div>
                        <div>{t("fileEditDoc.append", "新增内容")}</div>
                        <div className={styles["subDescription"]}>
                          {t(
                            "fileEditDoc.appendDescription",
                            "在原内容后面换行新增"
                          )}
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value={"cover"}>
                      <div>
                        <div>{t("fileEditDoc.cover", "覆盖内容")}</div>
                        <div className={styles["subDescription"]}>
                          {t("fileEditDoc.coverDescription", "完全覆盖原内容")}
                        </div>
                      </div>
                    </Select.Option>
                  </Select>
                </FormItem>
              )}

              <FormItem
                required
                label={t("fileEditDoc.addContent")}
                name="content"
                allowVariable
                type="string"
                rules={[
                  {
                    required: true,
                    message: t("emptyMessage"),
                  },
                ]}
              >
                <Input
                  placeholder={
                    parameters?.type === "xlsx"
                      ? "仅支持选择数组类型的变量"
                      : t("fileEditDoc.contentPlaceholder")
                  }
                  readOnly={parameters?.type === "xlsx"}
                />
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
                    title={t("fileEditDoc.source") + t("id", "ID")}
                  >
                    {t("fileEditDoc.source") + t("id", "ID")}
                  </Typography.Paragraph>
                  {t("colon", "：")}
                </td>
                <td>{input?.docid}</td>
              </tr>
              <tr>
                <td className={styles.label}>
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 2,
                    }}
                    className="applet-table-label"
                    title={t("fileEditDoc.insert_type")}
                  >
                    {t("fileEditDoc.insert_type")}
                  </Typography.Paragraph>
                  {t("colon", "：")}
                </td>
                <td>{t(`fileEditDoc.${input.insert_type}`)}</td>
              </tr>
              <tr>
                <td className={styles.label}>
                  <Typography.Paragraph
                    ellipsis={{
                      rows: 2,
                    }}
                    className="applet-table-label"
                    title={t("fileEditDoc.addContent")}
                  >
                    {t("fileEditDoc.addContent")}
                  </Typography.Paragraph>
                  {t("colon", "：")}
                </td>
                <td>{input?.content ? String(input.content) : ""}</td>
              </tr>
            </tbody>
          </table>
        );
      },
    },
  },
];
