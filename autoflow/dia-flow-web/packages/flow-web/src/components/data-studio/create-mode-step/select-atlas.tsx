import { Button, Form, Select, Space, Typography } from 'antd';
import { API, useTranslate } from '@applet/common';
import { DefaultOptionType } from 'antd/lib/select';
import styles from './create-mode-step.module.less';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FormItem } from '../../editor/form-item';
import { SelectDocLib } from '../trigger-config/select-doclib';
import { DocLibItem } from '../../as-file-select/doclib-list';

const { Text } = Typography;

interface ISelectAtlasProps {
    onNext: (value: IAtlasInfo) => void;
    onPrev: () => void;
    onClose: () => void;
    initialValues?: {
        graph_id?: string;
        entity_ids?: string[];
        edge_ids?: string[];
    };
    atlasInfo?: IAtlasInfo;
    selectTypes?: ItemType[]
}

export interface ISelectAtlasInfo {
    value: string;
    label: string;
}

export interface IAtlasInfo {
    edge_ids: ISelectAtlasInfo[];
    entity_ids: ISelectAtlasInfo[];
    graph_id: {
        value: string;
        label: string;
    };
    selectedDoc?: ISelectDoc;
}

export interface IEdge {
    relation: string[];
    edge_id: string;
}

interface IEntity {
    entity_id: string;
    name: string;
}

export interface IAtlas {
    edge: IEdge[];
    entity: IEntity[];
}

interface ISelectDoc {
    depth?: number;
    docs?: DocLibItem[];
    docids?: string[];
}

export enum ItemType {
    Graph = "graph_id",
    Entity = "entity_ids",
    Doc = "selectedDoc",
    IndexBase = "indexBase"
}

const DEFAULT_ENTITIES = ['tag', 'industry', 'customer', 'project', 'custom_subject'];
const DEFAULT_EDGES = [
    'document_2_tag_mention',
    'document_2_industry_mention',
    'document_2_customer_mention',
    'document_2_project_mention',
    'document_2_custom_subject_mention'
];

export const SelectAtlas = ({
    onNext,
    onPrev,
    onClose,
    initialValues,
    atlasInfo,
    selectTypes = [ItemType.Graph, ItemType.Entity, ItemType.Doc]
}: ISelectAtlasProps) => {
    const [form] = Form.useForm();
    const t = useTranslate();

    const [graphOptions, setGraphOptions] = useState<DefaultOptionType[]>([]);
    const [entityOptions, setEntityOptions] = useState<DefaultOptionType[]>([]);

    // 存储选中的完整选项信息
    const [selectedGraph, setSelectedGraph] = useState<ISelectAtlasInfo>();
    const [selectedEntities, setSelectedEntities] = useState<ISelectAtlasInfo[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<ISelectAtlasInfo[]>([]);

    const [selectDoc, setSelectDoc] = useState<ISelectDoc>();

    const docRef = useRef<{ validate: () => boolean }>()

    const atlas: IAtlas = useMemo(() => ({
        edge: [],
        entity: [],
    }), [])

    useEffect(() => {
        async function fetchGraphOptions() {
            try {
                const { data: knwData } = await API.axios.get(`/api/kn-knowledge-data/v1/knw/get_all?page=1&size=1000&order=desc&rule=update`, { allowTimestamp: false });
                if (!knwData?.res?.df?.length) return [];

                const options = await Promise.all(
                    knwData.res.df.map(async (knw: any) => {
                        try {
                            const { data: graphData } = await API.axios.get(
                                `/api/kn-knowledge-data/v1/knw/get_graph_by_knw?knw_id=${knw.id}&page=1&size=1000&order=desc&rule=update&name=`,
                                { allowTimestamp: false }
                            );
                            if (graphData?.res?.df?.length) {
                                return {
                                    label: knw.knw_name,
                                    options: graphData.res.df.map((graph: any) => ({
                                        label: graph.name,
                                        value: graph.id,
                                    })),
                                };
                            }
                        } catch (e) { }
                    })
                );
                setGraphOptions(options.filter(Boolean));

                // 如果有初始值，设置选中的图谱
                if (atlasInfo?.graph_id) {
                    setSelectedGraph(atlasInfo.graph_id);
                }
            } catch (e) {
                setGraphOptions([]);
            }
        }

        if (atlasInfo?.selectedDoc) {
            setSelectDoc(atlasInfo?.selectedDoc)
        } else {
            setSelectDoc(undefined)
        }

        fetchGraphOptions();
    }, [atlasInfo]);

    const handleGraphChange = async (value: { value: string; label: string }) => {
        setSelectedGraph(value);
        form.setFieldValue('graph_id', value);
        form.setFieldsValue({ entity_ids: [] });
        setSelectedEntities([]);
        setSelectedEdges([]);

        try {
            const { data } = await API.axios.get(
                `/api/kn-knowledge-data/v1/graph/info/onto?graph_id=${value.value}`,
                { allowTimestamp: false }
            );

            // Process entities
            const entityAlias: Record<string, string> = {};
            const entityNameToId: Record<string, string> = {};
            for (const entity of data?.res?.entity || []) {
                entityAlias[entity.name] = entity.alias;
                entityNameToId[entity.name] = entity.entity_id;
            }

            const entityOptions = (data?.res?.entity || []).map((entity: any) => ({
                label: entity.alias,
                value: entity.entity_id,
            }));
            setEntityOptions(entityOptions);

            atlas.edge = data?.res?.edge;
            atlas.entity = data?.res?.entity;
            // Process edges
            const edgeNameToId: Record<string, string> = {};
            const edgeOptions = (data?.res?.edge || []).map((edge: any) => {
                const [source, , target] = edge.relations || [];
                edgeNameToId[edge.name] = edge.edge_id;
                return {
                    label: source && target ?
                        `${entityAlias[source] || source} - ${edge.alias} - ${entityAlias[target] || target}`
                        : edge.name,
                    value: edge.edge_id,
                }
            });

            // Auto-select default entities and edges
            const defaultEntityIds = DEFAULT_ENTITIES
                .map(name => {
                    const id = entityNameToId[name];
                    if (id) {
                        const option = entityOptions.find((opt: ISelectAtlasInfo) => opt.value === id);
                        return option ? { value: id, label: option.label } : null;
                    }
                    return null;
                })
                .filter(Boolean);

            const defaultEdgeIds = DEFAULT_EDGES
                .map(name => {
                    const id = edgeNameToId[name];
                    if (id) {
                        const option = edgeOptions.find((opt: ISelectAtlasInfo) => opt.value === id);
                        return option ? { value: id, label: option.label } : null;
                    }
                    return null;
                })
                .filter(Boolean);

            setSelectedEntities(defaultEntityIds.map(item => item!));
            setSelectedEdges(defaultEdgeIds.map(item => item!));
            form.setFieldsValue({
                entity_ids: defaultEntityIds.map(item => item!.value)
            });
        } catch (e) {
            setEntityOptions([]);
        }
    };

    // 处理表单提交
    const handleSubmit = async () => {
        Promise.all([
            new Promise((reslove, reject) => docRef.current?.validate() ? reslove(true) : reject(false)),
            form.validateFields()
        ]).then(() => {
            onNext({
                graph_id: selectedGraph!,
                entity_ids: selectedEntities,
                edge_ids: selectedEdges,
                selectedDoc: selectDoc,
            });
        });
    };

    // 设置初始值
    useLayoutEffect(() => {
        if (atlasInfo) {
            setSelectedGraph(atlasInfo.graph_id);
            setSelectedEntities(atlasInfo.entity_ids);
            setSelectedEdges(atlasInfo.edge_ids);
            form.setFieldsValue({
                graph_id: atlasInfo.graph_id,
                entity_ids: atlasInfo.entity_ids,
            });
            handleGraphChange(atlasInfo.graph_id);
        }
    }, [form, atlasInfo]);

    const handleChangeEntities = (value: ISelectAtlasInfo[]) => {
        const entityKey = value.map(v => v.value);
        const selectEntityNames = atlas.entity.filter(v => entityKey.includes(v.entity_id)).map(v => v.name);

        const selectEdge = atlas.edge.filter((v) =>
            v.relation[0] === 'document' &&
            v.relation[1].endsWith('mention') &&
            selectEntityNames.includes(v.relation[2])
        ).map(v => v.edge_id);

        form.setFieldValue('edge_ids', selectEdge);
        form.validateFields(['edge_ids']);
    }

    const handleChange = (val: ISelectDoc) => {
        setSelectDoc(val);
    }

    const formItems: Record<ItemType, {
        ItemProps?: Record<string, any>,
        Component: JSX.Element
    }> = {
        [ItemType.Graph]: {
            ItemProps: {
                required: true,
                label: t("graph", "知识网络"),
                name: "graph_id",
                rules: [{ required: true, message: '此项不能为空' }]
            },
            Component:
                <Select
                    placeholder={t("graphPlaceholder", "请选择知识网络")}
                    options={graphOptions}
                    onChange={handleGraphChange}
                    labelInValue
                />
        },
        [ItemType.Entity]: {
            ItemProps: {
                required: true,
                label: t("entity", "实体"),
                name: "entity_ids",
                rules: [{ required: true, message: '此项不能为空' }]
            },
            Component:
                <Select
                    placeholder={t("entityPlaceholder", "请选择实体")}
                    showSearch={false}
                    options={entityOptions}
                    mode="multiple"
                    allowClear
                    labelInValue
                    onChange={(value) => {
                        if (!value?.length) {
                            setTimeout(() => {
                                setSelectedEntities([]);
                                setSelectedEdges([]);
                                form.setFieldValue('entity_ids', undefined);
                                form.validateFields(['entity_ids']);
                                form.setFieldValue('edge_ids', undefined);
                                form.validateFields(['edge_ids']);
                            });
                        } else {
                            setSelectedEntities(value);
                            handleChangeEntities(value);
                        }
                    }}
                />
        },
        [ItemType.Doc]: {
            Component: <SelectDocLib ref={docRef} parameters={selectDoc || {}} onChange={handleChange} />
        },
        [ItemType.IndexBase]: {
            Component: (
                <div>
                    <div style={{ 
                        marginBottom: 16, 
                        fontSize: 14, 
                        fontWeight: 500, 
                        color: "rgba(0, 0, 0, 0.85)" 
                    }}>
                        {t("datastudio.create.pdfParse.parseResultStorage", "解析结果存储至")}
                    </div>
                    <div style={{ 
                        backgroundColor: "#F0F7FF", 
                        padding: 16, 
                        borderRadius: 4,
                        marginBottom: 16
                    }}>
                        <FormItem
                            required
                            label={t("datastudio.create.pdfParse.documentMetadataIndex", "文档元数据索引库")}
                        >
                            <Select
                                value="content_document"
                                disabled
                                options={[{ label: "content_document", value: "content_document" }]}
                            />
                        </FormItem>
                        <FormItem
                            required
                            label={t("datastudio.create.pdfParse.documentElementIndex", "文档元素索引库")}
                        >
                            <Select
                                value="content_element"
                                disabled
                                options={[{ label: "content_element", value: "content_element" }]}
                            />
                        </FormItem>
                        <FormItem
                            required
                            label={t("datastudio.create.pdfParse.vectorIndex", "向量索引库")}
                        >
                            <Select
                                value="content_index"
                                disabled
                                options={[{ label: "content_index", value: "content_index" }]}
                            />
                        </FormItem>
                    </div>
                </div>
            )
        }
    }

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
        >
            {
                selectTypes?.map((type) => {
                    if (type in formItems) {
                        const { ItemProps, Component } = formItems[type]

                        if (ItemProps) {
                            return (
                                <FormItem {...ItemProps}>{Component}</FormItem>
                            )
                        } else {
                            return Component
                        }
                    } else {
                        return <></>
                    }
                })
            }

            <div className={styles['footer-buttons']}>
                <Button onClick={onPrev}>{t("back", "返回")}</Button>
                <Space>
                    <Button type="primary" className="automate-oem-primary-btn" onClick={handleSubmit}>
                        {t("ok", "确定")}
                    </Button>
                    <Button onClick={onClose}>
                        {t("cancel", "取消")}
                    </Button>
                </Space>
            </div>
        </Form>
    );
};
