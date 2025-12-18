import { Button, Form, Input } from "antd";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { FormItem } from "../../../editor/form-item";
import { useTranslate } from "@applet/common";
import { DocLibItem, DocLibList } from "../../../as-file-select/doclib-list";
// @ts-ignore
import { apis } from '@dip/components';
import { DocLibListNew } from "../../../as-file-select/doclib-list-new";
import _ from "lodash";
interface Parameters {
    docids?: string[]
    docs?: DocLibItem[]
    depth?: number
}

interface SelectDocLibProps {
    parameters: Parameters,
    onChange: (value: Parameters) => void
}

const SelectDocLib = forwardRef(({ parameters, onChange }: SelectDocLibProps, ref) => {
    const { docs: docLibs = [] } = parameters
    const t = useTranslate();
    const [form] = Form.useForm()

    useImperativeHandle(ref, () => {
        return {
            validate() {
                if (!docLibs.length) {
                    form?.validateFields()

                    return false
                }

                return true
            },
        };
    });

    const docLibsArry = () => {
      const newDocLibs = _.map(docLibs, (item) => ({
        ...item,
        id: item?.docid || item?.id,
      }));
      return newDocLibs;
    };

    const selectFn = () => {
      apis.selectFn({
        title: "从文档中心选择文件",
        multiple: true,
        selectType: 2,
        onConfirm: (selections: any[]) => {
          const newDocLibs = docLibsArry()
          const docsArry = [...newDocLibs, ...selections];
          const docs = _.uniqBy(docsArry, "id");
          onChange({
            depth: -1,
            docs,
            docids: docs.map(({ id }) => id),
          });
        },
      });
    };

    return (
        <div>
            <Form
                form={form}
                layout={'vertical'}
            >
                <FormItem
                    name={'docids'}
                    required
                    label={t("datastudio.trigger.scope", "适用范围")}
                    rules={[
                        {
                            required: true,
                            message: t("emptyMessage"),
                        },
                    ]}
                >
                    {
                        docLibs.length === 0
                            ? <div style={{ display: 'flex' }}>
                                <Input
                                    style={{ marginRight: '8px' }}
                                    placeholder={t("datastudio.trigger.scope.placeholder", "请选择文档库")}
                                />
                                <Button onClick={() => selectFn()}>
                                    {t("datastudio.trigger.scope.select", "选择")}
                                </Button>
                            </div>
                            : <DocLibListNew
                                data={docLibsArry()}
                                onAdd={() => selectFn()}
                                onChange={(value:any) => onChange({
                                    depth: -1,
                                    docs: value,
                                    docids: value.map(({ id }:any) => id)
                                })}
                            />
                    }
                </FormItem>
            </Form>
            {/* {
                showPicker
                    ? (
                        <DocLibsPicker
                            zIndex={9999}
                            selections={formattedInput(docLibs)}
                            onRequestSelectionChange={
                                (selections: DocLibItemRequest[]) => {
                                    if (!!selections.length) {
                                        form.setFields([{ name: 'docids', errors: [] }]);
                                    }

                                    const value = formattedOutput(selections)

                                    onChange({
                                        depth: -1,
                                        docs: value,
                                        docids: value.map(({ docid }) => docid)
                                    })
                                    setShowPicker(false)
                                }
                            }
                            onRequestClose={() => setShowPicker(false)}
                            isOrganization={false}
                            disabledSpecialLibList={['user_doc_lib']}
                        />
                    )
                    : null
            } */}
        </div >
    )
})

export { SelectDocLib }