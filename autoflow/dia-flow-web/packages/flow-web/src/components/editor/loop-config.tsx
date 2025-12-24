import { MicroAppContext, useTranslate } from "@applet/common";
import { Button, Drawer, Form, Input, InputNumber, Radio, Select, Space } from "antd";
import { FC, useContext, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { EditorContext } from "./editor-context";
import styles from "./editor.module.less";
import { IStep } from "./expr";
import { FormItem, FormItemWithVariable } from "./form-item";
import { Validatable } from "../extension";
import { CustomInput } from "../internal-tool/custom-params-input";
import { StepConfigContext } from "./step-config-context";

export interface LoopConfigProps {
    step?: IStep;
    onFinish?(step: IStep): void;
    onCancel?(): void;
}

export const LoopConfig = forwardRef<Validatable, LoopConfigProps>(({
    step,
    onFinish,
    onCancel,
}, ref) => {
    const { platform } = useContext(MicroAppContext);
    const { getPopupContainer, stepNodes } = useContext(EditorContext);
    const [form] = Form.useForm();
    const configRef = useRef<Validatable>(null);
    const outputParamsRef = useRef<Validatable>(null);
    const t = useTranslate();

    useEffect(() => {
        form.setFieldsValue({
            mode: step?.parameters?.mode || 'limit',
            limit: step?.parameters?.limit || 1,
            array: (() => {
                const arrayValue = step?.parameters?.array;
                
                // 如果是变量格式，直接返回
                if (typeof arrayValue === 'string' && /^\{\{__.*\}\}$/.test(arrayValue)) {
                    return arrayValue;
                }
                
                // 如果已经是数组，转换为 JSON 字符串
                if (Array.isArray(arrayValue)) {
                    return JSON.stringify(arrayValue);
                }
                
                // 如果是字符串，直接返回
                if (typeof arrayValue === 'string') {
                    return arrayValue;
                }
                
                // 默认返回空字符串
                return '';
            })(),
            outputs: step?.parameters?.outputs || []
        });
    }, [step, form]);

    const handleFinish = async (values: any) => {
        // 处理数组字段的转换
        const processedValues = {
            mode: values.mode || 'limit',
            limit: values.limit || 1,
            array: (() => {
                const arrayValue = values.array;
                
                // 如果是变量格式，直接返回
                if (typeof arrayValue === 'string' && /^\{\{__.*\}\}$/.test(arrayValue)) {
                    return arrayValue;
                }
                
                // 如果是字符串，尝试解析为数组
                if (typeof arrayValue === 'string' && arrayValue.trim()) {
                    try {
                        const parsed = JSON.parse(arrayValue);
                        if (Array.isArray(parsed)) {
                            return parsed;
                        }
                    } catch (error) {
                        console.error('解析数组失败:', error);
                        // 如果解析失败，返回原始字符串，让后续处理决定如何处理
                        return arrayValue;
                    }
                }
                
                // 如果已经是数组，直接返回
                if (Array.isArray(arrayValue)) {
                    return arrayValue;
                }
                
                // 默认返回空数组
                return [];
            })(),
            outputs: values.outputs || []
        };

        // 表单验证已经在 onFinish 触发前完成，这里直接调用 onFinish
        onFinish?.({
            ...step!,
            parameters: processedValues
        });
    };

    // 获取循环节点的子节点路径范围
    const getChildScope = () => {
        if (!step) return [];
        const currentNode = stepNodes[step.id];
        if (!currentNode) return [];

        // 获取当前循环节点的路径
        const currentPath = currentNode.path;

        // 返回子节点的路径范围
        return currentPath;
    };

    return (
        <StepConfigContext.Provider value={{ step }}>
            <Drawer
                open={!!step}
                push={false}
                onClose={onCancel}
                width={528}
                maskClosable={false}
                title={
                    <div className={styles.configTitle}>
                        {t("editor.loopConfigTitle", "设置循环")}
                    </div>
                }
                className={styles.configDrawer}
                getContainer={getPopupContainer}
                style={
                    platform === "client" ? { position: "absolute" } : undefined
                }
                footerStyle={{
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "none",
                }}
                footer={
                    <Space>
                        <Button
                            type="primary"
                            className="automate-oem-primary-btn"
                            onClick={async () => {
                                // 验证输出参数
                                let outputRes = true;
                                if (
                                    typeof outputParamsRef?.current
                                        ?.validate === "function"
                                ) {
                                    outputRes =
                                        await outputParamsRef.current?.validate();
                                }
                                if (!outputRes) {
                                    return;
                                }

                                // 验证表单字段
                                try {
                                    await form.validateFields();
                                    // 验证通过，提交表单
                                    form.submit();
                                } catch (error) {
                                    console.log('Form validation failed:', error);
                                }
                            }}
                        >
                            {t("ok", "确定")}
                        </Button>
                        <Button onClick={onCancel}>
                            {t("cancel", "取消")}
                        </Button>
                    </Space>
                }
            >
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        {t("editor.loopConfigTip", "请选择循环方式：")}
                    </div>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        initialValues={{
                            mode: step?.parameters?.mode || "limit",
                            limit: step?.parameters?.limit || 1,
                            array: (() => {
                                const arrayValue = step?.parameters?.array;
                                
                                // 如果是变量格式，直接返回
                                if (typeof arrayValue === 'string' && /^\{\{__.*\}\}$/.test(arrayValue)) {
                                    return arrayValue;
                                }
                                
                                // 如果已经是数组，转换为 JSON 字符串
                                if (Array.isArray(arrayValue)) {
                                    return JSON.stringify(arrayValue);
                                }
                                
                                // 如果是字符串，直接返回
                                if (typeof arrayValue === 'string') {
                                    return arrayValue;
                                }
                                
                                // 默认返回空字符串
                                return '';
                            })(),
                            outputs: step?.parameters?.outputs || []
                        }}
                    >
                        <FormItem
                            name="mode"
                            type="radio"
                            allowVariable={false}
                            rules={[
                                {
                                    required: true,
                                    message: t("editor.loopModeRequired", "请选择循环方式")
                                }
                            ]}
                        >
                            <Radio.Group>
                                <Radio value="limit">{t("editor.loopLimit", "固定次数")}</Radio>
                                <Radio value="array">{t("editor.loopVariable", "循环数组")}</Radio>
                            </Radio.Group>
                        </FormItem>
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
                            prevValues?.mode !== currentValues?.mode
                        }>
                            {({ getFieldValue }) =>
                                getFieldValue('mode') === 'limit' ? (
                                    <FormItemWithVariable
                                        label={t("editor.loopLimit", "循环次数")}
                                        name="limit"
                                        type="number"
                                        allowVariable={true}
                                        rules={[
                                            {
                                                required: true,
                                                message: t("editor.loopLimitRequired", "请输入循环次数")
                                            },
                                            {
                                                type: 'number',
                                                min: 1,
                                                message: t("editor.loopLimitMin", "循环次数必须大于0")
                                            },
                                            {
                                                validator: (_, value) => {
                                                    if (value && !Number.isInteger(value)) {
                                                        return Promise.reject(new Error(t("editor.loopLimitInteger", "循环次数必须是整数")));
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <InputNumber style={{ width: "100%" }} min={1} />
                                    </FormItemWithVariable>
                                ) : (
                                    <FormItemWithVariable
                                        label={t("editor.loopVariable", "循环数组")}
                                        name="array"
                                        type="array"
                                        allowVariable={true}
                                        rules={[
                                            {
                                                required: true,
                                                message: t("editor.loopArrayRequired", "请输入循环数组")
                                            },
                                            {
                                                validator: (_, value) => {
                                                    // 如果是变量格式，跳过验证
                                                    if (typeof value === 'string' && /^\{\{__.*\}\}$/.test(value)) {
                                                        return Promise.resolve();
                                                    }
                                                    
                                                    // 如果是字符串，尝试解析为数组
                                                    if (typeof value === 'string' && value.trim()) {
                                                        try {
                                                            const parsed = JSON.parse(value);
                                                            if (!Array.isArray(parsed)) {
                                                                return Promise.reject(new Error(t("editor.loopArrayInvalid", "请输入有效的数组格式")));
                                                            }
                                                            if (parsed.length === 0) {
                                                                return Promise.reject(new Error(t("editor.loopArrayEmpty", "数组不能为空")));
                                                            }
                                                            return Promise.resolve();
                                                        } catch (error) {
                                                            return Promise.reject(new Error(t("editor.loopArrayParseError", "数组格式错误，请检查JSON格式")));
                                                        }
                                                    }
                                                    
                                                    // 如果已经是数组
                                                    if (Array.isArray(value)) {
                                                        if (value.length === 0) {
                                                            return Promise.reject(new Error(t("editor.loopArrayEmpty", "数组不能为空")));
                                                        }
                                                        return Promise.resolve();
                                                    }
                                                    
                                                    return Promise.reject(new Error(t("editor.loopArrayRequired", "请输入循环数组")));
                                                }
                                            }
                                        ]}
                                    >
                                        <Input.TextArea 
                                            placeholder='请输入数组，例如: [1, 2, 3] 或 ["a", "b", "c"]'
                                            rows={3}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.trim()) {
                                                    try {
                                                        const parsed = JSON.parse(value);
                                                        if (Array.isArray(parsed)) {
                                                            // 验证成功，清除错误状态
                                                            form.setFields([
                                                                {
                                                                    name: 'array',
                                                                    errors: []
                                                                }
                                                            ]);
                                                        }
                                                    } catch (error) {
                                                        // 解析失败时不立即显示错误，等用户完成输入后再验证
                                                    }
                                                }
                                            }}
                                        />
                                    </FormItemWithVariable>
                                )
                            }
                        </Form.Item>
                        <FormItem
                            label={t("editor.loopOutputTitle", "循环输出")}
                            name="outputs"
                        >
                            <CustomInput
                                key="outputs"
                                t={t}
                                type="input"
                                ref={outputParamsRef}
                                scope={getChildScope()}
                            />
                        </FormItem>
                    </Form>
                </div>
            </Drawer>
        </StepConfigContext.Provider>
    );
}); 