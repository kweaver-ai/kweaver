import React, {
    ForwardedRef,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { ExecutorAction, ExecutorActionConfigProps, Validatable } from "../../components/extension/types";
import DataBaseSVG from './assets/database.svg'
import { Button, Form, Modal, Input, Select, SelectProps, Space, Spin, Divider, message, InputNumber } from "antd";
import { FormItem } from "../../components/editor/form-item";
import { CloseOutlined, ExclamationCircleOutlined, InfoCircleTwoTone, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import styles from './index.module.less'
import { FieldContext } from "rc-field-form";
import { API, DatePickerISO, MicroAppContext } from "@applet/common";
import { DefaultOptionType } from "antd/lib/select";
import { includes, isArray, isNumber } from "lodash";
import { DbAction, Intelliinfo, IntelliinfoPutOut } from "./types";
import { FieldData } from "rc-field-form/es/interface";

export const IntelliinfoTransfer = "@intelliinfo/transfer";

const { confirm } = Modal;


// 自定义类输出转换
const customOutputConver = (parameters: Intelliinfo): IntelliinfoPutOut[] => {
    const { action, graph_id, entities } = parameters

    return entities?.map((item) => {
        const { entity, property = [], edges = [] } = item

        return {
            graph_id,
            entities: [{
                name: entity,
                action,
                fields: property.map((item: { name: string, value: string }) => {
                    const { name, value } = item
                    const { value: key, type } = Object.fromEntries(new URLSearchParams(name))

                    return {
                        key,
                        type,
                        value
                    }
                })
            }],
            edges: edges.map((item) => {
                const { name, value, edge } = item
                const { value: key, type, entity } = Object.fromEntries(new URLSearchParams(name))

                return {
                    key,
                    type,
                    value: value.replace('{{entity}}', entity),
                    name: edge,
                    entity: entity
                }
            })
        }
    })
}

// 自定义类输入转换
const customInputConver = (value: IntelliinfoPutOut[]): Intelliinfo => {
    const { graph_id, entities: [{ action }] } = value[0]

    return {
        action,
        graph_id,
        entities: value.map((item) => {
            const { entities: [{ fields, name }], edges } = item

            return {
                entity: name,
                property: fields.map((field) => {
                    const { key, type, value } = field

                    return {
                        name: `value=${key}&type=${type}`,
                        value
                    }
                }),
                edges: edges.map((item) => {
                    const { key, type, value, name, entity } = item

                    return {
                        edge: name,
                        name: `value=${key}&type=${type}&entity=${entity}`,
                        value: value.replace(
                            /{{(__\d+)\.releation_map\.([^._]+)\._vid}}/g,
                            (_: any, prefix: string) => `{{${prefix}.releation_map.{{entity}}._vid}}`,
                        )
                    }
                })
            }
        })
    }
}

export const inputConver = (steps: { operator: string; parameters?: any; branches?: any[]; steps?: any[] }[]): any[] => {
    return steps.map((step) => {
        if (step.operator === '@intelliinfo/transfer') {
            const { rule_id, ...parameters } = step.parameters;

            let operator = '@intelliinfo/transfer'
            let rule

            if (rule_id) {
                const index = rule_id.indexOf('_')
                rule = rule_id.slice(index + 1)
                operator = `@intelliinfo/transfer-${rule_id.slice(0, index)}`
            }

            if (rule) {
                return {
                    ...step,
                    operator,
                    parameters: { ...parameters, rule },
                };
            } else {
                return {
                    ...step,
                    operator,
                    parameters: parameters?.data ? customInputConver(JSON.parse(parameters?.data)) : parameters,
                }
            }
        }
        if (step.operator === '@control/flow/branches' && Array.isArray(step.branches)) {
            const branches = step.branches.map(branch => ({
                ...branch,
                steps: inputConver(branch.steps || []),
            }));
            return {
                ...step,
                branches,
            };
        }

        if (step.operator === '@control/flow/loop') {
            return {
                ...step,
                steps: inputConver(step.steps || []),
            };
        }

        return step;
    });
}

export const outputConver = (steps: { operator: string; parameters?: any; branches?: any[]; steps?: any[] }[]): any[] => {
    return steps.map((step) => {
        if (step.operator?.includes('@intelliinfo/transfer')) {
            const { rule, ...parameters } = step.parameters
            const [newOperator, ruleId] = step.operator.split('-');


            if (rule) {
                return {
                    ...step,
                    operator: newOperator,
                    parameters: {
                        ...parameters,
                        rule_id: `${ruleId}_${rule}`,
                    },
                }

            } else {
                return {
                    ...step,
                    operator: newOperator,
                    parameters: { data: JSON.stringify(customOutputConver(parameters)) },
                }
            }
        }

        if (step?.operator === '@control/flow/branches' && Array.isArray(step.branches)) {
            const branches = step.branches.map(branch => ({
                ...branch,
                steps: outputConver(branch.steps || []),
            }));
            return {
                ...step,
                branches,
            };
        }

        if (step?.operator === '@control/flow/loop') {
            return { ...step, steps: outputConver(step.steps || []) };
        }

        return step;
    });
}

const Options = {
    document: [
        { label: 'db.fileContentUpdate', value: 'upsert_v2' },
        { label: 'db.fileMetaUpdate', value: 'update_v2' },
        { label: 'db.delFile', value: 'delete' }
    ],
    person: [
        { label: 'db.addUser', value: 'upsert' },
        { label: 'db.userAttributeUpdate', value: 'update' },
        { label: 'db.delUser', value: 'delete' },
    ],
    orgnization: [
        { label: 'db.addOrg', value: 'upsert' },
        { label: 'db.orgAttributeUpdate', value: 'update' },
        { label: 'db.userOrgAttributeUpdate', value: 'relation_update' },
        { label: 'db.delOrg', value: 'delete' }
    ],
    tag: [
        { label: 'db.addTag', value: 'upsert' },
        { label: 'db.updateTag', value: 'update' },
        { label: 'db.delTag', value: 'delete' }
    ]
}

const transformType = (type: string): string => {
    return ['int64', 'integer'].includes(type) ? 'number' : type
}

function useConfigForm(parameters: any, ref: ForwardedRef<Validatable>) {
    const [form] = Form.useForm();

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

    return form;
}

const Config = forwardRef(
    (
        {
            t,
            parameters = { text: "" },
            options = [],
            onChange,
        }: ExecutorActionConfigProps & { options?: SelectProps['options'] },
        ref: ForwardedRef<Validatable>
    ) => {
        const form = useConfigForm(parameters, ref);

        return (
            <Form
                form={form}
                layout="vertical"
                initialValues={parameters}
                onFieldsChange={() =>
                    onChange(form.getFieldsValue())
                }
            >
                <FormItem
                    required
                    label={t("db.writeRule", "写入规则")}
                    name="rule"
                    type="string"
                    rules={[
                        {
                            required: true,
                            message: t("emptyMessage"),
                        },
                    ]}
                >
                    <Select
                        placeholder={t("db.placeSelect", "请选择")}
                        options={options.map(({ value, label }) => ({ value, label: t(label as string) }))}
                    />
                </FormItem>
                <FormItem
                    required
                    label={t("db.dataToBeUpdated")}
                    name="data"
                    allowVariable
                    type="string"
                    rules={[
                        {
                            required: true,
                            message: t("emptyMessage"),
                        },
                    ]}
                >
                    <Input
                        autoComplete="off"
                        placeholder={t("db.placeSelect")}
                    />
                </FormItem>
            </Form>
        );
    }
)
const getPopupContainer = (): HTMLElement => document.querySelector("#data-base") || document.body;

export const GraphDataBaseExecutorActions: ExecutorAction[] = [
    {
        name: "FileOutputId",  // 文件
        description: "FileDesc",
        operator: `${IntelliinfoTransfer}-document`,
        icon: DataBaseSVG,
        group: "BuildIn",
        validate(parameters) {
            return parameters && parameters?.rule && parameters?.data;
        },
        components: {
            Config: forwardRef(
                (
                    props: ExecutorActionConfigProps,
                    ref: ForwardedRef<Validatable>
                ) => {
                    return <Config ref={ref} {...props} options={Options['document']} />
                }
            )
        }
    },
    {
        name: "User", // 用户
        description: "UserDesc",
        operator: `${IntelliinfoTransfer}-person`,
        icon: DataBaseSVG,
        group: "BuildIn",
        validate(parameters) {
            return parameters && parameters?.rule && parameters?.data;
        },
        components: {
            Config: forwardRef(
                (
                    props: ExecutorActionConfigProps,
                    ref: ForwardedRef<Validatable>
                ) => {
                    return <Config ref={ref} {...props} options={Options['person']} />
                }
            )
        }
    },
    {
        name: "Dep", // 组织
        description: "DepDesc",
        operator: `${IntelliinfoTransfer}-orgnization`,
        icon: DataBaseSVG,
        group: "BuildIn",
        validate(parameters) {
            return parameters && parameters?.rule && parameters?.data;
        },
        components: {
            Config: forwardRef(
                (
                    props: ExecutorActionConfigProps,
                    ref: ForwardedRef<Validatable>
                ) => {
                    return <Config ref={ref} {...props} options={Options['orgnization']} />
                }
            )
        }
    },
    // {
    //     name: "Tag", // 标签
    //     description: "TagDesc",
    //     operator: `${IntelliinfoTransfer}-tag`,
    //     icon: DataBaseSVG,
    //     group: "BuildIn",
    //     validate(parameters) {
    //         return parameters && parameters?.rule && parameters?.data;
    //     },
    //     components: {
    //         Config: forwardRef(
    //             (
    //                 props: ExecutorActionConfigProps,
    //                 ref: ForwardedRef<Validatable>
    //             ) => {
    //                 return <Config ref={ref} {...props} options={Options['tag']} />
    //             }
    //         )
    //     }
    // },
    {
        name: "db.customSelect", // 自定义选择
        description: "CustomDesc",
        operator: IntelliinfoTransfer,
        icon: DataBaseSVG,
        group: "Custom",
        validate(parameters) {
            return true
        },
        components: {
            Config: forwardRef(
                (
                    {
                        t,
                        parameters = {
                            action: DbAction.Upsert,
                            graph_id: undefined,
                            entities: [{}]
                        },
                        onChange,
                    }: ExecutorActionConfigProps & { options?: SelectProps['options'] },
                    ref: ForwardedRef<Validatable>
                ) => {

                    const form = useConfigForm(parameters, ref);

                    const [isLoading, setIsLoading] = useState<boolean>(false)
                    const [graphOptions, setGraphOptions] = useState<DefaultOptionType[]>([]);
                    const [entityOptions, setEntityOptions] = useState<DefaultOptionType[]>([]);

                    const entityMap = useRef<any>({})

                    const graph_id = form.getFieldValue('graph_id')
                    const action = form.getFieldValue('action')
                    const { microWidgetProps } = useContext(MicroAppContext);

                    useEffect(() => {
                        // 列举图谱
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
                            } catch (e) {
                                setGraphOptions([]);
                            }
                        }


                        async function init() {
                            setIsLoading(true)
                            await Promise.all([fetchGraphOptions(), fetchEntities(parameters?.graph_id, true)])
                            setIsLoading(false)
                        }

                        init()

                        // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, [])

                    // 列举实体
                    async function fetchEntities(graph_id: string, init: boolean) {
                        if (!graph_id) {
                            return
                        }

                        try {
                            // 获取所有默认已选属性、实体
                            let selected: Record<string, any> = {}
                            if (init) {
                                const { entities } = form.getFieldsValue()

                                entities.forEach(({ entity, property, edges }: any) => {
                                    selected[entity] = {
                                        property: property?.map(({ name }: any) => name) || [],
                                        edges: edges?.map(({ edge }: any) => edge) || []
                                    }
                                })
                            }

                            const { data } = await API.axios.get(`/api/intelliinfo/v1/graph/entities?graph_id=${graph_id}`, { allowTimestamp: false });
                            const entityOptions: DefaultOptionType[] = []

                            const { entities } = parameters
                            let selectEntities: string[] = []


                            if (entities?.length) {
                                const promiseArr = (entities || []).map((item: any) => {
                                    selectEntities.push(item.entity)
                                    const selectedEdges = selected[item.entity]?.edges || []

                                    return fetchEdges(graph_id, item.entity, selectedEdges)
                                })

                                await Promise.all(promiseArr)
                            }

                            data.forEach((data: any) => {
                                entityOptions.push({
                                    value: data.name,
                                    label: data.alias,
                                    selected: includes(selectEntities, data.name)
                                })

                                const selectedProperty = selected[data.name]?.property || []

                                entityMap.current = {
                                    ...entityMap.current,
                                    [data.name]: {
                                        ...entityMap.current[data.name] ? entityMap.current[data.name] : {},
                                        ...data,
                                        properties: data?.properties.reduce((prev: any, cur: any) => {
                                            const { name, type, alias, required } = cur

                                            const value = `value=${name}&type=${type}`
                                            const selected = includes(selectedProperty, value)

                                            return {
                                                ...prev,
                                                ...required
                                                    ? {
                                                        required: [
                                                            ...prev?.required,
                                                            {
                                                                label: alias,
                                                                value,
                                                                selected
                                                            }
                                                        ]
                                                    }
                                                    : {
                                                        optional: [
                                                            ...prev?.optional,
                                                            {
                                                                label: alias,
                                                                value,
                                                                selected
                                                            }
                                                        ]
                                                    }
                                            }

                                        }, { required: [], optional: [] })
                                    }
                                }
                            })

                            setEntityOptions(entityOptions)
                        } catch (error) {
                            setEntityOptions([])
                        }
                    }


                    async function fetchEdges(graph_id: string, enyity: string, selectedEdges: string[] = []) {
                        const { data: { edges } } = await API.axios.get(`/api/intelliinfo/v1/graph/edges?entity_name=${enyity}&graph_id=${graph_id}`, { allowTimestamp: false });

                        edges.forEach(({ name, props }: any) => {

                            entityMap.current = {
                                ...entityMap.current,
                                [enyity]: {
                                    ...entityMap.current[enyity],
                                    edges: {
                                        ...entityMap.current[enyity]?.edges || {},
                                        [name]: {
                                            values: props.map((item: any) => {
                                                const { edge_alias, entity, name, type } = item

                                                return {
                                                    label: edge_alias,
                                                    value: `value=${name}&type=${type}&entity=${entity}`,
                                                    selected: false
                                                }
                                            }),
                                            selected: includes(selectedEdges, name)
                                        }
                                    }
                                }
                            }
                        })
                    }

                    const onFieldsChange = async ([field]: FieldData[]) => {
                        const { name, value } = field

                        // list嵌套
                        // if (isArray(name) && name.length === 1 && name[0] === 'entities') {
                        //     // await form.setFieldValue(name, value)
                        //     form.setFieldValue(name, value)
                        // }

                        if (isArray(name)) {
                            let oldValues = form.getFieldsValue()

                            const updateItem = (name: (string | number)[]) => {
                                // 切换规则
                                if (name.length === 1 && name[0] === 'action') {
                                    return 'action'
                                }

                                // 切换图谱
                                if (name.length === 1 && name[0] === 'graph_id') {
                                    return 'graph_id'
                                }

                                // 删除整个实体类
                                if (name.length === 1 && name[0] === 'entities') {
                                    return 'entities'
                                }

                                // 修改实体类中的实体
                                if (name[0] === 'entities' && isNumber(name[1]) && name[2] === 'entity') {
                                    return 'entity'
                                }

                                // 删除实体类中实体的属性
                                if (name.length === 3 && name[0] === 'entities' && isNumber(name[1]) && name[2] === 'property') {
                                    return 'property'
                                }

                                // 修改实体类中实体的属性
                                if (name[0] === 'entities' && isNumber(name[1]) && name[2] === 'property' && isNumber(name[3]) && name[4] === 'name') {
                                    return 'property'
                                }

                                // 修改实体类中实体的关系
                                if (name.length === 3 && name[0] === 'entities' && isNumber(name[1]) && name[2] === 'edges') {
                                    return 'edges'
                                }

                                // 修改实体类中实体的关系关系名
                                if (name.length === 5 && name[0] === 'entities' && isNumber(name[1]) && name[2] === 'edges' && isNumber(name[3]) && name[4] === 'edge') {
                                    return 'edgs_edge'
                                }

                                // 修改实体类中实体的关系-客体属性
                                if (name.length === 5 && name[0] === 'entities' && isNumber(name[1]) && name[2] === 'edges' && isNumber(name[3]) && name[4] === 'name') {
                                    return 'edgs_name'
                                }
                            }

                            switch (updateItem(name)) {
                                case 'property': {
                                    const entity = form.getFieldValue([...name.slice(0, 2), 'entity'])
                                    const properties = form.getFieldValue([...name.slice(0, 3)])
                                    const propertyNames = properties.filter(Boolean).map((item: any) => item?.name)

                                    // 获取当前实体所有已选的可选属性
                                    const { properties: { optional } } = entityMap.current[entity]

                                    const newOptional = optional.map((item: any) => {
                                        return {
                                            ...item,
                                            selected: includes(propertyNames, item.value)
                                        }
                                    })

                                    entityMap.current = {
                                        ...entityMap.current,
                                        [entity]: {
                                            ...entityMap.current[entity],
                                            properties: {
                                                ...entityMap.current[entity].properties,
                                                optional: newOptional
                                            }
                                        }
                                    }

                                    if (name.length === 5) {
                                        oldValues.entities[name[1]]['property'][name[3]].value = undefined
                                    }

                                    onChange(oldValues)

                                    return
                                }

                                case 'edgs_name': {
                                    // 切换客体属性名，清空对应课题属性值
                                    oldValues.entities[name[1]]['edges'][name[3]].value = undefined

                                    onChange(oldValues)

                                    return
                                }

                                // @ts-ignore
                                case 'edgs_edge': {
                                    // 关系变动，清除对应项的已选项
                                    oldValues.entities[name[1]]['edges'][name[3]].name = undefined
                                    oldValues.entities[name[1]]['edges'][name[3]].value = undefined

                                    // fallthrough
                                }

                                case 'edges': {
                                    const entity = form.getFieldValue([...name.slice(0, 2), 'entity'])
                                    const edges = form.getFieldValue([...name.slice(0, 3)])
                                    const existEdges = edges.map(({ edge }: any) => edge).filter(Boolean)

                                    entityMap.current = {
                                        ...entityMap.current,
                                        [entity]: {
                                            ...entityMap.current[entity],
                                            edges: {
                                                ...Object.keys(entityMap.current[entity].edges).reduce((acc: any, edge) => {
                                                    acc[edge] = {
                                                        ...entityMap.current[entity].edges[edge],
                                                        selected: includes(existEdges, edge)
                                                    };
                                                    return acc;
                                                }, {}),
                                            }
                                        }
                                    }

                                    onChange(oldValues)

                                    return;
                                }

                                // @ts-ignore
                                case 'entity': {
                                    const entity = form.getFieldValue(name)
                                    const graph_id = form.getFieldValue("graph_id")
                                    await fetchEdges(graph_id, entity)

                                    // 清除已选关系
                                    oldValues.entities[name[1]].edges = []
                                    const { properties = { required: [], optional: [] } } = entityMap.current[entity]
                                    const { required = [], optional } = properties
                                    const requiredOptions = (required || [])?.map((item: any) => {
                                        return {
                                            name: item.value,
                                            value: undefined
                                        }
                                    })

                                    // 获取新的必须属性作默认
                                    // if (form.getFieldValue('action') === DbAction.Upsert) {
                                    //     oldValues.entities[name[1]].property = [...requiredOptions]
                                    // } else {
                                    //     oldValues.entities[name[1]].property = [requiredOptions[0]]
                                    // }

                                    oldValues.entities[name[1]].property = [...requiredOptions]

                                    // fallthrough
                                }

                                case 'entities': {
                                    const { entities } = oldValues
                                    const exitsEntities = entities.filter((item: any) => item.hasOwnProperty('entity'))
                                    const selectedEntities = exitsEntities?.map((item: any) => item.entity)

                                    // 将该实体标记已选
                                    setEntityOptions(
                                        entityOptions.map((item) => {
                                            return {
                                                ...item,
                                                selected: includes(selectedEntities, item.value)
                                            }
                                        })
                                    )

                                    onChange({ ...oldValues, entities: exitsEntities })

                                    return
                                }
                            }
                        }

                        onChange(form.getFieldsValue())
                    }

                    return (
                        <div id={"data-base"} className={styles['container']}>
                            {
                                isLoading
                                    ? (
                                        <div className={styles['spin']}>
                                            <Spin />
                                        </div>
                                    )
                                    : (
                                        <Form
                                            form={form}
                                            layout="vertical"
                                            initialValues={parameters}
                                            onValuesChange={async (value) => {
                                                const { graph_id } = value

                                                if (graph_id) {
                                                    await fetchEntities(graph_id, false)
                                                }
                                            }}

                                            onFieldsChange={onFieldsChange}
                                        >
                                            <div style={{ height: '84px', overflow: 'hidden' }}>
                                                <FormItem
                                                    required
                                                    label={t("db.writeRule", "写入规则")}
                                                    name="action"
                                                    type="string"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: t("emptyMessage"),
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        getPopupContainer={getPopupContainer}
                                                        placeholder={t("db.placeSelect", "请选择")}
                                                        options={[
                                                            {
                                                                label: t("db.update", "更新"),
                                                                value: DbAction.Upsert,
                                                            },
                                                            {
                                                                label: t("db.delete", "删除"),
                                                                value: DbAction.Delete,
                                                            }
                                                        ]}
                                                    />
                                                </FormItem>
                                                <Select
                                                    placeholder={t("db.placeSelect", "请选择")}
                                                    value={parameters?.action}
                                                    style={{ width: '100%', position: 'relative', top: parameters?.action ? '-54px' : '10px' }}
                                                    getPopupContainer={getPopupContainer}
                                                    options={[
                                                        {
                                                            label: t("db.update", "更新"),
                                                            value: DbAction.Upsert,
                                                        },
                                                        {
                                                            label: t("db.delete", "删除"),
                                                            value: DbAction.Delete,
                                                        }
                                                    ]}
                                                    onChange={(value) => {
                                                        if (parameters?.action && value !== parameters?.action && form.getFieldValue('entities').some((item: any) => item.entity)) {
                                                            confirm({
                                                                title: t("db.switch.rule", "确认切换写入规则吗？"),
                                                                icon: <ExclamationCircleOutlined />,
                                                                content: t("db.switch.result", "切换后，下方的设置将会被清空。"),
                                                                getContainer: microWidgetProps?.container,
                                                                onOk() {
                                                                    form.setFieldValue('entities', [{ entity: undefined }])
                                                                    form.setFieldValue('action', value)

                                                                    onFieldsChange([{ name: ['entities'] }])
                                                                },
                                                                onCancel() { },
                                                            })
                                                        } else {
                                                            form.setFieldValue('action', value)

                                                            onChange({ ...form.getFieldsValue(), action: value })
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div style={{ height: '84px', overflow: 'hidden' }}>
                                                <FormItem
                                                    required
                                                    label={t("db.knowledgeGraph", "知识网络")}
                                                    name="graph_id"
                                                    type="string"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: t("emptyMessage"),
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        getPopupContainer={getPopupContainer}
                                                        placeholder={t("db.placeSelect", "请选择")}
                                                        options={graphOptions.flatMap(({ options }) => options)}
                                                    />
                                                </FormItem>
                                                <Select
                                                    placeholder={t("db.placeSelect", "请选择")}
                                                    value={parameters?.graph_id}
                                                    style={{ width: '100%', position: 'relative', top: parameters?.graph_id ? '-54px' : '10px' }}
                                                    getPopupContainer={getPopupContainer}
                                                    options={graphOptions.flatMap(({ options }) => options)}
                                                    onChange={async (value) => {
                                                        if (parameters?.graph_id && value !== parameters?.graph_id && form.getFieldValue('entities').some((item: any) => item.entity)) {
                                                            confirm({
                                                                title: t("db.switch.kg", "确认切换知识网络吗？"),
                                                                icon: <ExclamationCircleOutlined />,
                                                                content: t("db.switch.result", "切换后，下方的设置将会被清空。"),
                                                                getContainer: microWidgetProps?.container,
                                                                onOk: async () => {
                                                                    form.setFieldValue('entities', [{ entity: undefined }])
                                                                    form.setFieldValue('graph_id', value)

                                                                    await fetchEntities(value, false)

                                                                    onFieldsChange([{ name: ['entities'] }])
                                                                },
                                                                onCancel() { },
                                                            })
                                                        } else {
                                                            form.setFieldValue('graph_id', value)
                                                            await fetchEntities(value, false)

                                                            onChange({ ...form.getFieldsValue(), graph_id: value })
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div style={{ marginLeft: '12px' }}>
                                                {
                                                    <FieldContext.Provider value={{ ...form, prefixName: ['entities'] } as any}>
                                                        <>
                                                            <Form.List name="entities" >
                                                                {
                                                                    (fields, { add, remove }) => (
                                                                        <>
                                                                            {fields.map((field, index) => {
                                                                                const { key, name: entitiyName, ...restField } = field
                                                                                const curEntity = form.getFieldValue(['entities', entitiyName, 'entity'])
                                                                                const entityExist = !!entityMap.current[curEntity]

                                                                                return (
                                                                                    <div className={styles['entity']}>
                                                                                        <div className={styles['entity-title']}>
                                                                                            {`${t("db.entityType", "实体类")}${fields.length > 1 ? index + 1 : ''}`}
                                                                                        </div>
                                                                                        {
                                                                                            // 未选择知识网络不可添加实体
                                                                                            !!graph_id
                                                                                                ? <Space key={key} align="baseline" style={{ width: '100%', display: 'block' }}>
                                                                                                    <FormItem
                                                                                                        {...restField}
                                                                                                        isListField={true}
                                                                                                        label={t("db.entity", "实体")}
                                                                                                        name={[entitiyName, 'entity']}
                                                                                                        rules={[{
                                                                                                            required: true,
                                                                                                            message: t("emptyMessage")
                                                                                                        }]}
                                                                                                        style={{ width: '100%' }}
                                                                                                    >
                                                                                                        <Select
                                                                                                            getPopupContainer={getPopupContainer}
                                                                                                            placeholder={t("db.select.entity", "请选择实体")}
                                                                                                            options={
                                                                                                                entityOptions.filter((item) => {
                                                                                                                    return !item.selected || (entityExist && item.value === curEntity)
                                                                                                                })
                                                                                                            }
                                                                                                        />
                                                                                                    </FormItem>

                                                                                                    {/* 属性 */}
                                                                                                    {
                                                                                                        form.getFieldValue(['entities', entitiyName, 'entity'])
                                                                                                            ? <>
                                                                                                                <FieldContext.Provider value={{ ...form, prefixName: ['entities', entitiyName, 'property'] } as any}>
                                                                                                                    <Form.List name={[entitiyName, 'property']}>
                                                                                                                        {(propertyFields, { add: addProperty, remove: removeProperty }) => {
                                                                                                                            if (!entityExist) {
                                                                                                                                return null
                                                                                                                            }

                                                                                                                            let disabledAdd = false

                                                                                                                            return (
                                                                                                                                <>
                                                                                                                                    {propertyFields.map(({ key: propertyKey, name: propertyName, ...restPropertyField }, index) => {
                                                                                                                                        // 该实体必选属性
                                                                                                                                        const entity = form.getFieldValue(['entities', entitiyName, 'entity'])
                                                                                                                                        const { properties: { optional = [], required = [] } } = entityMap.current[entity]
                                                                                                                                        const requiredNum = (required || []).length
                                                                                                                                        const isRequired = action === DbAction.Delete || requiredNum > propertyName

                                                                                                                                        // 当前所选属性
                                                                                                                                        const curPropertyName = form.getFieldValue(['entities', entitiyName, 'property', propertyName, 'name'])

                                                                                                                                        let propertyValueType = []
                                                                                                                                        if (curPropertyName) {
                                                                                                                                            const { value, type } = Object.fromEntries(new URLSearchParams(curPropertyName))

                                                                                                                                            propertyValueType.push(transformType(type))
                                                                                                                                        }

                                                                                                                                        // 属性和可选项
                                                                                                                                        let options = []

                                                                                                                                        if (curEntity) {
                                                                                                                                            if (isRequired) {
                                                                                                                                                options = required
                                                                                                                                            } else {

                                                                                                                                                options = optional.filter((item: any) => {
                                                                                                                                                    return !item.selected || item.value === curPropertyName
                                                                                                                                                })
                                                                                                                                            }

                                                                                                                                            disabledAdd = propertyName + 1 === requiredNum + optional.length
                                                                                                                                        }

                                                                                                                                        return (
                                                                                                                                            <>
                                                                                                                                                <Space key={propertyKey} align="center" className={styles['form-list']}>
                                                                                                                                                    <FormItem
                                                                                                                                                        {...restPropertyField}
                                                                                                                                                        label={`${t("db.attribute", "属性")}${propertyFields.length > 1 ? index + 1 : ''}`}
                                                                                                                                                        name={[propertyName, 'name']}
                                                                                                                                                        rules={[{ required: true, message: t("emptyMessage") }]}
                                                                                                                                                        style={{ width: '100%' }}
                                                                                                                                                    >
                                                                                                                                                        <Select
                                                                                                                                                            getPopupContainer={getPopupContainer}
                                                                                                                                                            disabled={isRequired}
                                                                                                                                                            placeholder={t("db.select.attribute", "请选择属性")}
                                                                                                                                                            options={options}
                                                                                                                                                        />
                                                                                                                                                    </FormItem>
                                                                                                                                                    <FormItem
                                                                                                                                                        {...restPropertyField}
                                                                                                                                                        label={t("db.attributeValue", "属性值")}
                                                                                                                                                        name={[propertyName, 'value']}
                                                                                                                                                        rules={[{ required: true, message: t("emptyMessage") }]}
                                                                                                                                                        style={{ width: '100%' }}
                                                                                                                                                        allowVariable
                                                                                                                                                        // type={propertyValueType}
                                                                                                                                                    >
                                                                                                                                                        <ItemRender
                                                                                                                                                            style={{ width: '100%' }}
                                                                                                                                                            t={t}
                                                                                                                                                            type={propertyValueType}
                                                                                                                                                            placeholder={t("db.enter.attribute", "请输入属性值")}
                                                                                                                                                        />
                                                                                                                                                    </FormItem>

                                                                                                                                                    <MinusCircleOutlined
                                                                                                                                                        className={isRequired ? styles['remove-disabled'] : ''}
                                                                                                                                                        onClick={() => isRequired ? null : removeProperty(propertyName)}
                                                                                                                                                    />

                                                                                                                                                </Space>
                                                                                                                                            </>
                                                                                                                                        )
                                                                                                                                    })}
                                                                                                                                    {
                                                                                                                                        action === DbAction.Upsert && !disabledAdd
                                                                                                                                            ? <Form.Item>
                                                                                                                                                <Button
                                                                                                                                                    type="link"
                                                                                                                                                    onClick={() => addProperty({ name: undefined, value: undefined })}
                                                                                                                                                    className="flex items-center"
                                                                                                                                                    icon={<PlusOutlined />}
                                                                                                                                                >
                                                                                                                                                    {t("db.add.attribute", "添加属性")}
                                                                                                                                                </Button>
                                                                                                                                            </Form.Item>
                                                                                                                                            : null
                                                                                                                                    }
                                                                                                                                </>
                                                                                                                            )
                                                                                                                        }}
                                                                                                                    </Form.List>
                                                                                                                </FieldContext.Provider>
                                                                                                                {
                                                                                                                    action === DbAction.Upsert
                                                                                                                        ? <>
                                                                                                                            {/* 关系 */}
                                                                                                                            <FieldContext.Provider value={{ ...form, prefixName: ['entities', entitiyName, 'edges'] } as any}>
                                                                                                                                <Form.List name={[entitiyName, 'edges']}>
                                                                                                                                    {(edgesFields, { add: addEdge, remove: removeRelationship }) => {
                                                                                                                                        let disabled = false

                                                                                                                                        if (!entityExist) {
                                                                                                                                            return null
                                                                                                                                        }

                                                                                                                                        return (
                                                                                                                                            <>
                                                                                                                                                {edgesFields.map(({ key: edgesKey, name: edgesName, ...restRelationshipField }, index) => {
                                                                                                                                                    let edgeOptions: any = []

                                                                                                                                                    // 获取关系列
                                                                                                                                                    try {
                                                                                                                                                        // 获取当前所选实体
                                                                                                                                                        const curEntity = form.getFieldValue(['entities', entitiyName, 'entity'])

                                                                                                                                                        const curEdge = form.getFieldValue(['entities', entitiyName, 'edges', edgesName, 'edge'])

                                                                                                                                                        if (curEntity) {
                                                                                                                                                            const { edges } = entityMap.current[curEntity]
                                                                                                                                                            const edgeKeys = Object.keys(edges)

                                                                                                                                                            disabled = edgeKeys.length === edgesName + 1
                                                                                                                                                            edgeOptions = edgeKeys.filter((item) => !edges[item]?.selected || curEdge === item).map((item) => {
                                                                                                                                                                return {
                                                                                                                                                                    value: item,
                                                                                                                                                                    label: item
                                                                                                                                                                }
                                                                                                                                                            })
                                                                                                                                                        }
                                                                                                                                                    } catch (error) { }

                                                                                                                                                    let edgeNameOptions: any = []

                                                                                                                                                    try {
                                                                                                                                                        // 获取当前所选实体
                                                                                                                                                        const curEntity = form.getFieldValue(['entities', entitiyName, 'entity'])
                                                                                                                                                        const curEdge = form.getFieldValue(['entities', entitiyName, 'edges', edgesName, 'edge'])

                                                                                                                                                        if (curEntity && curEdge) {
                                                                                                                                                            const { edges } = entityMap.current[curEntity]

                                                                                                                                                            edgeNameOptions = edges[curEdge]?.values

                                                                                                                                                        }

                                                                                                                                                    } catch (error) { }

                                                                                                                                                    // 客体属性值
                                                                                                                                                    let edgeValueType = []
                                                                                                                                                    const curEdgeName = form.getFieldValue(['entities', entitiyName, 'edges', edgesName, 'name'])
                                                                                                                                                    if (curEdgeName) {
                                                                                                                                                        const { value: edgeValue, type } = Object.fromEntries(new URLSearchParams(curEdgeName))

                                                                                                                                                        edgeValueType.push(transformType(type))

                                                                                                                                                        if (edgeValue === '_vid') {
                                                                                                                                                            edgeValueType.push('entity_edges_vid')
                                                                                                                                                        }
                                                                                                                                                    }

                                                                                                                                                    return (
                                                                                                                                                        <Space key={edgesKey} align="baseline" className={styles['form-list-edge']}>
                                                                                                                                                            <FormItem
                                                                                                                                                                {...restRelationshipField}
                                                                                                                                                                label={`${t("db.relationship", "关系")}${edgesFields.length > 1 ? index + 1 : ''}`}
                                                                                                                                                                name={[edgesName, 'edge']}
                                                                                                                                                                rules={[{ required: true, message: t("emptyMessage") }]}
                                                                                                                                                                style={{ width: '100%', marginBottom: '12px' }}
                                                                                                                                                            >
                                                                                                                                                                <Select
                                                                                                                                                                    getPopupContainer={getPopupContainer}
                                                                                                                                                                    placeholder={t("db.select.relationship", "请选择关系")}
                                                                                                                                                                    options={edgeOptions}
                                                                                                                                                                />
                                                                                                                                                            </FormItem>
                                                                                                                                                            <Space align="baseline" style={{ width: '100%' }} className={styles['edge']}>
                                                                                                                                                                <FormItem
                                                                                                                                                                    {...restRelationshipField}
                                                                                                                                                                    label={t("db.objectAttribute", "客体属性")}
                                                                                                                                                                    name={[edgesName, 'name']}
                                                                                                                                                                    rules={[{ required: true, message: t("emptyMessage") }]}
                                                                                                                                                                    style={{ width: '100%' }}
                                                                                                                                                                >
                                                                                                                                                                    <Select
                                                                                                                                                                        placeholder={t("db.select.objectAttribute", "请选择客体属性")}
                                                                                                                                                                        options={edgeNameOptions}
                                                                                                                                                                    />
                                                                                                                                                                </FormItem>
                                                                                                                                                                <FormItem
                                                                                                                                                                    {...restRelationshipField}
                                                                                                                                                                    label={t("db.objectAttributeValue", "客体属性值")}
                                                                                                                                                                    name={[edgesName, 'value']}
                                                                                                                                                                    rules={[{ required: true, message: t("emptyMessage") }]}
                                                                                                                                                                    style={{ width: '100%' }}
                                                                                                                                                                    allowVariable
                                                                                                                                                                    type={edgeValueType}
                                                                                                                                                                >
                                                                                                                                                                    <ItemRender
                                                                                                                                                                        style={{ width: '100%' }}
                                                                                                                                                                        t={t}
                                                                                                                                                                        type={edgeValueType}
                                                                                                                                                                        placeholder={t("db.enter.objectAttributeValue", "请输入客体属性值")}
                                                                                                                                                                    />
                                                                                                                                                                </FormItem>
                                                                                                                                                            </Space>
                                                                                                                                                            <CloseOutlined className={styles['form-list-edge-remove']} onClick={() => removeRelationship(edgesName)} />
                                                                                                                                                        </Space>
                                                                                                                                                    )
                                                                                                                                                })}
                                                                                                                                                {
                                                                                                                                                    !disabled
                                                                                                                                                        ? <Form.Item>
                                                                                                                                                            <Button
                                                                                                                                                                type="link"
                                                                                                                                                                onClick={() => addEdge({ edge: undefined, value: undefined })}
                                                                                                                                                                className="flex items-center"
                                                                                                                                                                icon={<PlusOutlined />}
                                                                                                                                                            >
                                                                                                                                                                {t("db.add.relationship", "添加关系")}
                                                                                                                                                            </Button>
                                                                                                                                                        </Form.Item>
                                                                                                                                                        : null
                                                                                                                                                }
                                                                                                                                            </>
                                                                                                                                        )
                                                                                                                                    }}
                                                                                                                                </Form.List>
                                                                                                                            </FieldContext.Provider>
                                                                                                                        </>
                                                                                                                        : null
                                                                                                                }
                                                                                                            </>
                                                                                                            : null
                                                                                                    }
                                                                                                </Space>
                                                                                                : (
                                                                                                    <div className={styles['entity-tip']}>
                                                                                                        <InfoCircleTwoTone />
                                                                                                        <span className={styles['entity-tip-text']}>
                                                                                                            {t("db.select.kgfirst", "请先选择知识网络")}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                )
                                                                                        }
                                                                                        {
                                                                                            !!graph_id && fields.length > 1 && (
                                                                                                <CloseOutlined
                                                                                                    className={styles['entity-remove']}
                                                                                                    onClick={() => {
                                                                                                        remove(entitiyName);

                                                                                                        onFieldsChange([{ name: ['entities'] }])
                                                                                                    }}
                                                                                                />
                                                                                            )
                                                                                        }
                                                                                        <Divider />
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                            {
                                                                                !!graph_id
                                                                                    ? (
                                                                                        <Button
                                                                                            onClick={() => {
                                                                                                // 判断是否超过10
                                                                                                if (fields.length >= 10) {
                                                                                                    message.warning(t("db.entity.maximum", "您添加的实体已达上限"))

                                                                                                    return
                                                                                                }

                                                                                                add({ entity: undefined })
                                                                                            }}
                                                                                            className="flex items-center"
                                                                                            icon={<PlusOutlined />}
                                                                                        >
                                                                                            {t("db.add.entity", "添加实体")}
                                                                                        </Button>
                                                                                    )
                                                                                    : null
                                                                            }

                                                                        </>
                                                                    )}
                                                            </Form.List>
                                                        </>
                                                    </FieldContext.Provider>
                                                }
                                            </div>
                                        </Form >
                                    )
                            }
                        </div>
                    );
                }
            )
        }
    }
]

function ItemRender({ type, t, ...props }: any): React.ReactElement {
    if (type.includes('number')) {
        return <InputNumber {...props} />
    }
    if (type.includes('datetime')) {
        return <DatePickerISO showTime   {...props} />
    }
    if (type.includes('boolean')) {
        return <Select
            {...props}
            options={[
                { label: t("db.boolean.yes", "是"), value: true },
                { label: t("db.boolean.no", "否"), value: false }
            ]}
        />
    }
    return <Input  {...props} />
}
