import { forwardRef, useImperativeHandle, useLayoutEffect } from "react";
import { ExecutorActionConfigProps, Validatable } from "../../components/extension";
import { Form, Input, Select } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { AsFileSelect } from "../../components/as-file-select";
import useSWR from "swr";
import { API } from "@applet/common";
import { DefaultOptionType } from "antd/lib/select";

export interface ContentEntityParameters {
  docid: string;
  version: string;
  graph_id: string;
  entity_ids: string[];
  edge_ids: string[];
}

export const ContentEntityConfig = forwardRef<Validatable, ExecutorActionConfigProps<ContentEntityParameters>>(({ t, parameters = {} as any, onChange }, ref) => {
  const [form] = Form.useForm<ContentEntityParameters>();

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

  const { data: graphOptions } = useSWR<DefaultOptionType[]>(
    `/api/kn-knowledge-data/v1/knw/get_all?page=1&size=1000&order=desc&rule=update`,
    async (url) => {
      try {
        const { data: knwData } = await API.axios.get(url, { allowTimestamp: false });

        if (!knwData?.res?.df?.length) {
          return [];
        }

        const options = await Promise.all(
          knwData.res.df.map(async (knw: any) => {
            try {
              const { data: graphData } = await API.axios.get(`/api/kn-knowledge-data/v1/knw/get_graph_by_knw?knw_id=${knw.id}&page=1&size=1000&order=desc&rule=update&name=`, {
                allowTimestamp: false,
              });
              if (graphData?.res?.df?.length) {
                return {
                  label: knw.knw_name,
                  options: graphData.res.df.map((graph: any) => ({
                    label: graph.name,
                    value: graph.id,
                  })),
                };
              }
            } catch (e) {}
          })
        );

        return options.filter(Boolean);
      } catch (e) {}

      return [];
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const { data: [entityOptions, edgeOptions] = [[], []], isValidating } = useSWR<[DefaultOptionType[], DefaultOptionType[]]>(
    `/api/kn-knowledge-data/v1/graph/info/onto?graph_id=${parameters?.graph_id}`,
    async (url) => {
      if (!parameters?.graph_id) return [[], []] as [DefaultOptionType[], DefaultOptionType[]];

      try {
        const { data } = await API.axios.get(url, { allowTimestamp: false });
        const entityAlias: Record<string, string> = {};
        for (const entity of data?.res?.entity || []) {
          entityAlias[entity.name] = entity.alias;
        }

        return [
          (data?.res?.entity || []).map((entity: any) => ({
            label: entity.alias,
            value: entity.entity_id,
          })),
          (data?.res?.edge || []).map((edge: any) => {
            const [source, , target] = edge.relations || [];

            return {
              label: source && target ? `${entityAlias[source] || source} - ${edge.alias} - ${entityAlias[target] || target}` : edge.name,
              value: edge.edge_id,
            };
          }),
        ];
      } catch (e) {}

      return [[], []] as [DefaultOptionType[], DefaultOptionType[]];
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

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
      <FormItem
        required
        label={t("graph", "知识网络")}
        name="graph_id"
        rules={[
          {
            required: true,
            message: t("emptyMessage", "此项不能为空"),
          },
        ]}
      >
        <Select
          placeholder={t("graphPlaceholder", "请选择知识网络")}
          options={graphOptions}
          onChange={() => {
            form.setFieldsValue({ entity_ids: [], edge_ids: [] });
          }}
        />
      </FormItem>
      <FormItem
        required
        label={t("entity", "实体")}
        name="entity_ids"
        allowVariable={false}
        rules={[
          {
            required: true,
            message: t("emptyMessage", "此项不能为空"),
          },
        ]}
      >
        <Select
          placeholder={t("entityPlaceholder", "请选择实体")}
          showSearch={false}
          options={entityOptions}
          mode="multiple"
          allowClear
          onChange={(value) => {
            if (!value?.length) {
              setTimeout(() => {
                form.setFieldValue("entity_ids", undefined);
                form.validateFields(["entity_ids"]);
              });
            }
          }}
        />
      </FormItem>
      <FormItem
        required
        label={t("edge", "关系")}
        name="edge_ids"
        allowVariable={false}
        rules={[
          {
            required: true,
            message: t("emptyMessage", "此项不能为空"),
          },
        ]}
      >
        <Select
          placeholder={t("edgePlaceholder", "请选择关系")}
          showSearch={false}
          options={edgeOptions}
          mode="multiple"
          allowClear
          onChange={(value) => {
            if (!value?.length) {
              setTimeout(() => {
                form.setFieldValue("edge_ids", undefined);
                form.validateFields(["edge_ids"]);
              });
            }
          }}
        />
      </FormItem>
    </Form>
  );
});
