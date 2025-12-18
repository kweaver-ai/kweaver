import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
} from "react";
import { Form, Input, Select, Radio, Switch, Tooltip } from "antd";
import { DefaultOptionType } from "antd/lib/select";
import useSWR from "swr";
import { API, AsFileSelect } from "@applet/common";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { FormItem } from "../../components/editor/form-item";
import styles from "./content-file-parse-config.module.less";

enum SourceTypeEnum {
  Docid = "docid",
  Url = "url",
}

export enum SliceVectorEnum {
  None = "none",
  Slice = "slice", // 仅分片
  SliceVector = "slice_vector", // 分片+向量化
}

export interface ContentFileParseParameters {
  source_type: SourceTypeEnum; // 必填，输入类型
  docid?: string; // 文件 gns ，当 source_type 为 file 时必填
  version?: string; // 文件版本，选填，默认最新版本
  url?: string; // 资源下载链接，当source_type 为url 时必填
  filename?: string; // 文件名，当source_type 为url时必填
  slice_vector: SliceVectorEnum;
  model?: string; // 模型, slice_vector 为 slice_vector 时 必填
}

export const ContentFileParseConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<ContentFileParseParameters>
>(({ t, parameters = {}, onChange }, ref) => {
  const { source_type = SourceTypeEnum.Docid, slice_vector } = parameters;
  const [form] = Form.useForm<ContentFileParseParameters>();

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

  // 过滤出 embedding 模型
  const embeddingModelOptions = useMemo(
    () =>
      smallModels?.filter((item: any) => item.model_type === "embedding") || [],
    [smallModels]
  );

  const sliceVectorOptions = useMemo(() => {
    const renderLabel = ({
      label,
      description,
    }: {
      label: string;
      description: string;
    }) => (
      <div style={{ marginBottom: 8 }} className={styles["slice-config-item"]}>
        <span className={styles["label"]}>{label}</span>
        <Tooltip title={description}>
          <div className={styles["description"]}>{description}</div>
        </Tooltip>
      </div>
    );
    return [
      {
        value: SliceVectorEnum.None,
        label: renderLabel({
          label: t("noSliceVector", "不分片且不向量化"),
          description: t(
            "noSliceVectorDescription",
            "仅输出文件解析后的结构化信息"
          ),
        }),
      },
      {
        value: SliceVectorEnum.Slice,
        label: renderLabel({
          label: t("slice", "仅切片不向量化"),
          description: t(
            "sliceDescription",
            "同时输出文件解析后的结构化信息和切片结果"
          ),
        }),
      },
      {
        value: SliceVectorEnum.SliceVector,
        label: renderLabel({
          label: t("sliceAndVector", "切片且向量化"),
          description: t(
            "sliceAndVectorDescription",
            "同时输出文件解析后的结构化信息和切片向量化的结果"
          ),
        }),
      },
    ];
  }, [t]);

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
    form.setFieldsValue({
      source_type: SourceTypeEnum.Docid,
      slice_vector: SliceVectorEnum.None,
      ...parameters,
    });
  }, [form, parameters]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={parameters}
      onFieldsChange={() => onChange(form.getFieldsValue())}
    >
      {source_type === SourceTypeEnum.Docid && (
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
          <AsFileSelect
            title={t("fileSelectTitle")}
            multiple={false}
            omitUnavailableItem
            selectType={1}
            placeholder={t("pdfFilePlaceholder", "请选择PDF格式的文件")}
            selectButtonText={t("select")}
            supportExtensions={["pdf"]}
          />
        </FormItem>
      )}

      {source_type === SourceTypeEnum.Url && (
        <FormItem
          required
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
            placeholder={t(
              "urlPlaceholder",
              "请输入URL，示例：https://www.example.com/123.pdf"
            )}
          />
        </FormItem>
      )}

      <FormItem name="source_type" style={{ marginTop: "-18px" }}>
        <Switch
          className={styles["switch"]}
          size="small"
          defaultChecked={source_type === SourceTypeEnum.Url}
          onChange={(checked) => {
            form.setFieldValue(
              "source_type",
              checked ? SourceTypeEnum.Url : SourceTypeEnum.Docid
            );

            onChange(form.getFieldsValue());
          }}
        />
        <div className={styles["switch-label"]}>
          {source_type === SourceTypeEnum.Url
            ? t(
                "urlSwitchLabelWithFormat",
                "通过URL地址选择文件，支持PDF格式的文件"
              )
            : t("urlSwitchLabel", "通过URL地址选择文件")}
        </div>
      </FormItem>

      {source_type === SourceTypeEnum.Docid && (
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

      {source_type === SourceTypeEnum.Url && (
        <FormItem
          required
          label={t("filename", "文件名称")}
          name="filename"
          allowVariable
          type="string"
          rules={[
            {
              required: true,
              message: t("emptyMessage", "此项不能为空"),
            },
          ]}
        >
          <Input placeholder={t("filenamePlaceholder", "请输入")} />
        </FormItem>
      )}

      <FormItem
        required
        name="slice_vector"
        label={t("sliceVectorConfig", "解析配置")}
      >
        <Radio.Group
          options={sliceVectorOptions}
          className={styles["slice-config-radio-group"]}
        />
      </FormItem>

      {/* 当开启“分片+向量化”时才显示模型选择 */}
      {slice_vector === SliceVectorEnum.SliceVector && (
        <FormItem
          name="model"
          rules={[
            {
              required: true,
              message: t("emptyMessage"),
            },
          ]}
          type="string"
          style={{ paddingLeft: 24, marginTop: "-24px" }}
        >
          <Select
            options={embeddingModelOptions}
            placeholder={t("modelPlaceholder", "请选择")}
          />
        </FormItem>
      )}
    </Form>
  );
});
