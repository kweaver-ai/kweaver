import { Extension } from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import JSONSvg from "./assets/db.svg";
import { forwardRef, useImperativeHandle, useEffect } from "react";
import { Form, Input } from "antd";
import { DatabaseConfigPanel } from "./database-config-panel";
import { useTranslateExtension } from "../../components/extension-provider";

const convertFieldMappingsToParameters = (fieldMappings: any[]) => {
  return fieldMappings.map((m: any) => ({
    target: {
      name: m.targetField,
      comment: m.comment,
      data_lenth: typeof m.targetLength === "number" ? m.targetLength : undefined,
      data_type: m.targetType,
      is_nullable: m.isNotNull ? "NO" : "YES",
      primary_key: m.isPrimaryKey ? 1 : 0,
      precision: undefined,
    },
    source: {
      name: m.sourceField,
      comment: undefined,
      data_lenth: typeof m.sourceLength === "number" ? m.sourceLength : undefined,
      data_type: m.sourceType,
      is_nullable: undefined,
      primary_key: undefined,
    },
  }));
};

const SqlWriteExtension: Extension = {
  name: "SqlWrite",
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
  executors: [
    {
      name: "sqlWrite.name",
      description: "sqlWrite.description",
      icon: JSONSvg,
      actions: [
        {
          name: "sqlWrite.name",
          description: "sqlWrite.description",
          operator: "@internal/database/write",
          icon: JSONSvg,
          outputs: () => [],
          validate(parameters) {
            return parameters;
          },
          components: {
            Config: forwardRef(({ parameters = {}, onChange }: any, ref) => {
              const t = useTranslateExtension('SqlWrite');
              const [connectionForm] = Form.useForm();
              const [targetTableForm] = Form.useForm();
              const [sourceForm] = Form.useForm();

              useImperativeHandle(ref, () => ({
                async validate() {
                  try {
                    await Promise.all([
                      connectionForm.validateFields(),
                      targetTableForm.validateFields(),
                      sourceForm.validateFields(),
                    ]);
                    return true;
                  } catch {
                    return false;
                  }
                },
              }));

              const mapToParameters = (data: any) => {
                const connection = data?.connection || {};
                const targetTable = data?.targetTable || {};
                const fieldMappings = Array.isArray(data?.fieldMappings)
                  ? data.fieldMappings
                  : [];
                const formData = data?.data;
                const incomingSyncOptions = (data as any)?.sync_options || {};

                const tableExist = targetTable.tableMode === "existing";
                const tableName = tableExist
                  ? targetTable.existingTable
                  : targetTable.tableName;

                const sync_model_fields = fieldMappings.length
                  ? convertFieldMappingsToParameters(fieldMappings)
                  : [];

                const mapped = {
                  datasource_type: connection?.connectionType ?? parameters?.datasource_type,
                  datasource_id: connection?.connectionId ?? parameters?.datasource_id,
                  datasource_name: connection?.connectionName ?? parameters?.datasource_name,
                  table_exist:
                    typeof tableExist === "boolean"
                      ? tableExist
                      : Boolean(parameters?.table_exist),
                  table_name: tableName || parameters?.table_name,
                  operate_type: "append",
                  sync_model_fields,
                  data: typeof formData !== "undefined" ? formData : parameters?.data,
                  sync_options: {
                    batch_size:
                      typeof incomingSyncOptions.batch_size === "number" && incomingSyncOptions.batch_size > 0
                        ? incomingSyncOptions.batch_size
                        : (parameters?.sync_options?.batch_size ?? 1000),
                    truncate_before_write:
                      typeof incomingSyncOptions.truncate_before_write === "boolean"
                        ? incomingSyncOptions.truncate_before_write
                        : (parameters?.sync_options?.truncate_before_write ?? false)
                  },
                } as any;

                return mapped;
              };

              const mapToInitialData = (params: any) => {
                if (
                  params &&
                  (params.connection || params.targetTable || params.fieldMappings)
                ) {
                  return params;
                }
                const connection = {
                  connectionType: params?.datasource_type,
                  connectionName: params?.datasource_name,
                  connectionId: params?.datasource_id,
                };
                const tableMode = params?.table_exist ? "existing" : "create";
                const targetTable =
                  tableMode === "existing"
                    ? { tableMode, existingTable: params?.table_name }
                    : { tableMode, tableName: params?.table_name };
                const fieldMappings = Array.isArray(params?.sync_model_fields)
                  ? params.sync_model_fields.map((m: any, idx: number) => ({
                      id: String(idx + 1),
                      sourceField: m?.source?.name,
                      sourceType: m?.source?.data_type,
                      sourceLength: m?.source?.data_lenth,
                      targetField: m?.target?.name,
                      targetType: m?.target?.data_type,
                      targetLength: m?.target?.data_lenth,
                      comment: m?.target?.comment,
                      isPrimaryKey: m?.target?.primary_key === 1,
                      isNotNull: m?.target?.is_nullable === "NO",
                      selected: false,
                    }))
                  : [];
                return { 
                  connection, 
                  targetTable, 
                  fieldMappings, 
                  data: (typeof params?.data === 'object' && params.data !== null) 
                    ? JSON.stringify(params.data) 
                    : String(params?.data ?? ""),
                  sync_options: params?.sync_options || { batch_size: 1000, truncate_before_write: false }
                };
              };

              return (
                <DatabaseConfigPanel
                  initialData={mapToInitialData(parameters)}
                  connectionForm={connectionForm}
                  targetTableForm={targetTableForm}
                  sourceForm={sourceForm}
                  onChange={(data) => {
                    if (typeof onChange === "function") {
                      onChange(mapToParameters(data));
                    }
                  }}
                  t={t}
                />
              );
            }),
          },
        },
      ],
    },
  ],
};

export default SqlWriteExtension;




