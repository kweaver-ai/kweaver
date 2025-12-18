import { forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import { ExecutorActionConfigProps, Validatable } from "../../components/extension";
import { Form, Input } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";

export interface ContentFulltextParameters {
  docid: string;
  version: string;
}

export const ContentFulltextConfig = forwardRef<Validatable, ExecutorActionConfigProps<ContentFulltextParameters>>(({ t, parameters = {}, onChange }, ref) => {
  const [form] = Form.useForm<ContentFulltextParameters>();

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
    <Form form={form} layout="vertical" initialValues={parameters} onFieldsChange={() => onChange(form.getFieldsValue())}>
      <FormItem
        required
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
        <AsFileSelect title={t("fileSelectTitle")} multiple={false} readOnly omitUnavailableItem selectType={1} placeholder={t("extractFilePlaceholder")} selectButtonText={t("select")} />
      </FormItem>
      <FormItem label={t("version", "版本")} name="version" allowVariable type="string">
        <Input placeholder={t("versionPlaceholder", "请输入版本")} />
      </FormItem>
    </Form>
  );
});
