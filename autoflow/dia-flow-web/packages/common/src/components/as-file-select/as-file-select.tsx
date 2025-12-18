import { efast } from "@applet/api";
import { Button, Input, Select } from "antd";
import clsx from "clsx";
import { clamp } from "lodash";
import React, {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR from "swr";
import API from "../../api";
import { useTranslate } from "../../hooks";
import { MicroAppContext } from "../micro-app";
import styles from "./as-file-select.module.less";
// @ts-ignore
import { apis } from "@dip/components";

export interface DocItem {
  id: string;
  name: string;
  path: string;
  [key: string]: any;
}

export interface AsFileSelectProps<M extends boolean> {
  className?: string;
  title?: string;
  placeholder?: string;
  selectButtonText?: string;
  selectType?: 1 | 2 | 3;
  disabled?: boolean;
  readOnly?: boolean;
  supportExtensions?: string[]; // 比如 ["txt"]
  multiple?: M;
  defaultValue?: M extends true ? string[] : string;
  value?: M extends true ? string[] : string;
  omitUnavailableItem?: boolean;
  omittedMessage?: string;
  onChange?(value?: M extends true ? string[] : string): void;
  onOmitUnavailableItem?(ids: string[]): void;
}

export function AsFileSelect<M extends boolean>(props: AsFileSelectProps<M>) {
  const {
    className,
    multiple,
    defaultValue,
    value,
    selectType = 3,
    title,
    placeholder,
    selectButtonText = "选择",
    disabled,
    readOnly,
    supportExtensions,
    omittedMessage,
    omitUnavailableItem = false,
    onOmitUnavailableItem,
    onChange,
  } = props;

  const { microWidgetProps, functionId, platform } =
    useContext(MicroAppContext);
  const namepathsCache = useRef<Record<string, Promise<DocItem>>>({});
  const docLibsCache = useRef<Promise<efast.ClassifiedEntryDoc[]>>();
  const isSecretCache = useRef<boolean | undefined>(undefined);
  const t = useTranslate();
  const isControlled = "value" in props;
  const [ids, setIds] = useState<string[]>(() => {
    return (Array.isArray(defaultValue) ? defaultValue : [defaultValue]).filter(
      Boolean
    );
  });
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);

  useLayoutEffect(() => {
    if (isControlled) {
      setIds((Array.isArray(value) ? value : [value]).filter(Boolean));
    }
  }, [props.value]);

  const { data } = useSWR(
    ["asFileSelect", ids],
    async () => {
      // if (platform !== "client") {
      //   return [];
      // }

      if (!docLibsCache.current) {
        docLibsCache.current = API.efast
          .efastV1ClassifiedEntryDocLibsGet()
          .then(({ data }) => data);
      }

      const docLibs = await docLibsCache.current;

      const results = await Promise.allSettled(
        ids.map(async (id) => {
          if (!namepathsCache.current[id]) {
            const promise = new Promise<DocItem>(async (resolve, reject) => {
              try {
                const { data } = await API.efast.efastV1FileConvertpathPost({
                  docid: id,
                });

                let path = data.namepath;

                for (const lib of docLibs) {
                  if (
                    lib.doc_libs &&
                    lib.doc_libs.some((item) => id.startsWith(item.id))
                  ) {
                    // 涉密 共享文档库名称变更
                    if (
                      lib.id === "shared_user_doc_lib" &&
                      typeof isSecretCache.current === "undefined"
                    ) {
                      try {
                        const { data } =
                          await API.appStore.apiAppstoreV1SecretConfigGet();
                        isSecretCache.current = data?.is_security_level;
                      } catch (error) {
                        isSecretCache.current = true;
                      }
                    }
                    if (
                      lib.id === "shared_user_doc_lib" &&
                      isSecretCache.current === true
                    ) {
                      path = `${t("shared_user_doc_lib.secret", lib.name)}/${
                        data.namepath
                      }`;
                    } else {
                      // 顶级文档库国际化处理（我的/共享/部门/知识库）
                      path = `${t(lib.id, lib.name)}/${data.namepath}`;
                    }
                  }

                  if (lib.subtypes) {
                    for (const subtype of lib.subtypes) {
                      if (
                        (subtype.doc_libs as unknown as efast.EntryDoc[]).some(
                          (item) => id.startsWith(item.id)
                        )
                      ) {
                        path = `${subtype.name}/${data.namepath}`;
                      }
                    }
                  }
                }

                resolve({
                  id,
                  name: data.namepath.slice(data.namepath.lastIndexOf("/") + 1),
                  path,
                });
              } catch (e) {
                reject();
                if (namepathsCache.current[id] === promise) {
                  delete namepathsCache.current[id];
                }
              }
            });
            namepathsCache.current[id] = promise;
          }

          return namepathsCache.current[id];
        })
      );

      const unavailableIds = results
        .map(({ status }, i) => status === "rejected" && ids[i])
        .filter(Boolean);

      if (omitUnavailableItem && unavailableIds.length) {
        setUnavailableIds(unavailableIds);
        if (typeof onOmitUnavailableItem === "function") {
          onOmitUnavailableItem(unavailableIds);
        }
        const availableIds = results
          .filter((result) => result.status === "fulfilled")
          .map(
            (result) => (result as PromiseFulfilledResult<DocItem>).value.id
          );
        if (isControlled) {
          if (isControlled) {
            (onChange as (v: string | string[]) => void)(
              multiple ? availableIds : availableIds[0]
            );
          } else {
            setIds(multiple ? availableIds : availableIds.slice(0, 1));
          }
        }
      }

      return results
        .map((result) => {
          if (result.status === "fulfilled") {
            return result.value;
          }
        })
        .filter(Boolean);
    },
    // 此时间段内具有相同密钥的重复数据消除请求
    { dedupingInterval: 0 }
  );

  const availableIds = useMemo(() => {
    if (data) {
      return data.map((item) => item.id);
    }
    return [];
  }, [data]);

    return (
      <div
        className={clsx(styles.container, className, multiple && "multiple")}
      >
        {multiple ? (
          <Select
            mode="tags"
            className={clsx(styles.input, styles.multiple, "input")}
            open={false}
            value={availableIds}
            showSearch={false}
            searchValue=""
            placeholder={placeholder}
            disabled={disabled}
            onChange={(ids) => {
              (onChange as (value: string[]) => void)(
                ids.length ? ids : undefined
              );
              setUnavailableIds([]);
            }}
          >
            {ids.length
              ? data?.map((item) => (
                  <Select.Option key={item.id}>
                    <span title={item.path || item.name}>{item.name}</span>
                  </Select.Option>
                ))
              : []}
          </Select>
        ) : (
          <Input
            className={clsx(styles.input, "input")}
            placeholder={placeholder}
            readOnly
            value={
              data && data.length ? data[0].path || data[0].name : undefined
            }
          />
        )}
        {!readOnly && (
          <Button
            disabled={disabled}
            onClick={async () => {
              try {
                apis.selectFn({
                  title,
                  multiple: true,
                  selectType,
                  supportExtensions,
                  onConfirm: (selections: any[]) => {
                    let result: any = selections;
                    if (multiple) {
                      if (!Array.isArray(result)) {
                        result = [result].filter(Boolean);
                      }

                      if (result.length) {
                        const newValue = [...ids];

                        result.forEach((item: any) => {
                          const id = (item.id || item.docid) as string;

                          if (!newValue.includes(id)) {
                            newValue.push(id);
                          }
                        });
                        if (isControlled) {
                          (onChange as (value: string[]) => void)(
                            newValue.length ? newValue : undefined
                          );
                        } else {
                          setIds(newValue);
                        }
                      }
                    } else {
                      if (Array.isArray(result)) {
                        result = result[0];
                      }
                      if (result) {
                        if (isControlled) {
                          (onChange as (value: string) => void)(
                            result.id || result.docid
                          );
                        } else {
                          setIds([result.id || result.docid]);
                        }
                      } else {
                        if (isControlled) {
                          onChange(undefined);
                        } else {
                          setIds([]);
                        }
                      }
                    }
                  },
                });

                setUnavailableIds([]);
              } catch (e) {}
            }}
          >
            {selectButtonText}
          </Button>
        )}
        {ids.length && unavailableIds.length && omittedMessage ? (
          <div className={styles.omittedMessage}>{omittedMessage}</div>
        ) : null}
      </div>
    );
}
