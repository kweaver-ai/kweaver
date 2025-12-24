import { forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import { AsFileSelect } from "@applet/common";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { Form, Input } from "antd";
import { FormItem } from "../../components/editor/form-item";

interface OcrNewParameters {
  docid: string; // 文件 gns ，当 source_type 为 docid 时必填
  version?: string; // 文件版本，选填，默认最新版本
}
// 支持的文件扩展名
const supportExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "tif",
];
const displayExtensions = supportExtensions.map((item) => `.${item}`).join(" ");

export const OcrNewConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<OcrNewParameters>
>(({ t, parameters = {}, onChange }, ref) => {
  const [form] = Form.useForm<OcrNewParameters>();

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
        label={t("imageFile", "图片文件")}
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
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          {t("imageFormatSupport", `支持 ${displayExtensions} 格式`, {
            displayExtensions,
          })}
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
