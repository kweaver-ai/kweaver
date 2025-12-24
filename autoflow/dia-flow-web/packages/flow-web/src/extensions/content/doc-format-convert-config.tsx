import { forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import { Form, Input, Tooltip, Button } from "antd";
import { AsFileSelect } from "@applet/common";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { FormItem } from "../../components/editor/form-item";

interface DocFormatConvertParameters {
  docid: string; // 文件 gns ，当 source_type 为 docid 时必填
  version?: string; // 文件版本，选填，默认最新版本
}
// 支持的文件扩展名
const supportExtensions = [
  "txt",
  "cpp",
  "h",
  "go",
  "py",
  "cs",
  "c",
  "php",
  "ini",
  "yaml",
  "css",
  "doc",
  "docx",
  "odt",
  "dotx",
  "wps",
  "dotm",
  "docm",
  "dot",
  "ott",
  "xls",
  "xlsx",
  "xlsb",
  "xlsm",
  "et",
  "xltx",
  "xltm",
  "xml",
  "xlt",
  "csv",
  "ods",
  "ppt",
  "pptx",
  "odp",
  "potm",
  "potx",
  "pps",
  "ppsm",
  "ppsx",
  "pptm",
  "dps",
  "pot",
  "pdf",
  "ofd",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tif",
  "tiff",
  "ai",
  "psd",
  "psb",
  "heic",
];
const displayExtensions = supportExtensions.map((item) => `.${item}`).join(" ");

export const DocFormatConvertConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<DocFormatConvertParameters>
>(({ t, parameters = {}, onChange }, ref) => {
  const [form] = Form.useForm<DocFormatConvertParameters>();

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

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
      initialValues={parameters}
      onFieldsChange={() => onChange(form.getFieldsValue())}
    >
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
          placeholder={t("extractFilePlaceholder", "请选择文件")}
          selectButtonText={t("select")}
          supportExtensions={supportExtensions}
        />
      </FormItem>

      <FormItem label="" style={{ marginTop: "-24px" }}>
        <Tooltip showArrow title={displayExtensions}>
          <Button type="link">{t("view", "查看")}</Button>
        </Tooltip>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          {t("supportedFileFormats", "支持的文件格式")}
        </span>
      </FormItem>

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
    </Form>
  );
});
