import { Extension } from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Form, Input, Select } from "antd";
import { API, MicroAppContext } from "@applet/common";
import { FormItem } from "../../components/editor/form-item";
import EditorWithMentions from "../ai/editor-with-mentions";
import OpensearchSVG from "./assets/opensearch.svg";
const { TextArea } = Input;

const OpenSearchExtension: Extension = {
  name: "opensearch",
  executors: [
    {
      name: "opensearch",
      description: "opensearchDescription",
      icon: OpensearchSVG,
      actions: [
        {
          name: "opensearch",
          description: "opensearchDescription",
          operator: "@opensearch/bulk-upsert",
          icon: OpensearchSVG,
          outputs: (step: any) => {
            // if (step.parameters?.output_params) {
            //     return step.parameters?.output_params?.map(
            //         (item: any) => ({
            //             key: `.${item.key}`,
            //             name: item.key,
            //             type:
            //                 item.type === "int"
            //                     ? "number"
            //                     : item.type,
            //             isCustom: true,
            //         })
            //     );
            // }
            return [];
          },
          validate(parameters) {
            return parameters;
          },
          components: {
            Config: forwardRef(
              (
                {
                  t,
                  parameters = {
                    input_params: [],
                    output_params: [],
                  },
                  onChange,
                }: any,
                ref
              ) => {
                const [form] = Form.useForm();
                // 添加搜索关键词状态
                const [searchKeyword, setSearchKeyword] = useState("");
                const { prefixUrl } = useContext(MicroAppContext);
                const limit = 50;
                const [indexBaseList, setIndexBaseList] = useState([]);
                const [currentPage, setCurrentPage] = useState(0);
                const [isValidating, setIsValidating] = useState(false);
                const [hasMore, setHasMore] = useState(true);

                useImperativeHandle(ref, () => {
                  return {
                    async validate() {
                      let inputRes = true;
                      let outputRes = true;
                      // if (
                      //   typeof inputParamsRef?.current?.validate === "function"
                      // ) {
                      //   inputRes = await inputParamsRef.current?.validate();
                      // }
                      // if (
                      //   typeof outputParamsRef?.current?.validate === "function"
                      // ) {
                      //   outputRes = await outputParamsRef.current?.validate();
                      // }
                      // if (!inputRes || !outputRes) {
                      //   return false;
                      // }

                      return form.validateFields().then(
                        () => true,
                        () => false
                      );
                    },
                  };
                });

                useEffect(() => {
                  getIndexBases();
                }, [searchKeyword, currentPage]);

                const getIndexBases = async () => {
                  setIsValidating(true);
                  try {
                    const { data } = await API.axios.get(
                      `${prefixUrl}/api/mdl-index-base/v1/index_bases?limit=${limit}&offset=${
                        currentPage * limit
                      }&name_pattern=${searchKeyword || ""}`
                    );
                    const result = data?.entries?.map((item: any) => ({
                      value: item.base_type,
                      label: item.name,
                      data_type: item.data_type,
                      category: item.category,
                    }));
                    setIndexBaseList((prev: any) =>
                      currentPage === 0 ? result : [...prev, ...result]
                    );
                    if (data?.entries?.length < limit) {
                      setHasMore(false);
                    }
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setIsValidating(false);
                  }
                };

                const handleSearch = (keyword: string) => {
                  setCurrentPage(0);
                  setHasMore(true);
                  setSearchKeyword(keyword);
                };

                const handleScroll = useCallback(
                  (e: any) => {
                    const { scrollTop, scrollHeight, clientHeight } =
                      e.currentTarget;
                    const isBottom =
                      scrollTop + clientHeight >= scrollHeight - 10;
                    if (isBottom && !isValidating && hasMore) {
                      setCurrentPage((prevPage) => prevPage + 1);
                    }
                  },
                  [isValidating]
                );

                const onChangeSelect = (value: string, option: any) => {
                  form.setFieldValue("data_type", option?.data_type);
                  form.setFieldValue("category", option?.category);
                };

                const textAreaContent = (data: any, itemName:string) => {
                  form.setFieldValue(itemName, data)
                };

                return (
                  <Form
                    form={form}
                    layout="vertical"
                    initialValues={parameters}
                    onFieldsChange={() => {
                      setTimeout(() => {
                        onChange(form.getFieldsValue());
                      }, 100);
                    }}
                  >
                    <FormItem label="索引库" name="base_type" required>
                      <Select
                        loading={isValidating}
                        allowClear
                        filterOption={false}
                        options={indexBaseList}
                        onPopupScroll={handleScroll}
                        placeholder={t("modelPlaceholder", "请选择")}
                        onChange={onChangeSelect}
                        showSearch
                        searchValue={searchKeyword}
                        onSearch={handleSearch} // 添加搜索事件处理
                      />
                    </FormItem>
                    <FormItem label="索引库1" name="data_type" hidden>
                      <Input />
                    </FormItem>
                    <FormItem label="索引库2" name="category" hidden>
                      <Input />
                    </FormItem>
                    <FormItem label="索引内容" name="documents">
                       <EditorWithMentions onChange={textAreaContent} parameters={parameters?.documents} itemName="documents"/>
                    </FormItem>
                  </Form>
                );
              }
            ),
          },
        },
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
};

export default OpenSearchExtension;
