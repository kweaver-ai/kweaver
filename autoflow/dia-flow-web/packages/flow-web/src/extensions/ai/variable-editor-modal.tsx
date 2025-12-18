import React, { useContext, useEffect, useMemo, useState } from "react";
import { Modal, Input, Form, Button } from "antd";
import { VariableItem } from "./variable-item";
import "./variable-editor-modal.less";
import { EditorContext } from "../../components/editor/editor-context";

interface VariableEditorModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (newVariable: string) => void;
  initialVariable?: any;
  position?: { top: number; left: number };
}

export const VariableEditorModal: React.FC<VariableEditorModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  initialVariable,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [variableVal, setVariableVal] = useState(initialVariable);
  const { stepNodes, stepOutputs } = useContext(EditorContext);

  useEffect(() => {
    const value = initialVariable?.value;
    if (value) {
     // 找到最精确的匹配项（最长的匹配前缀）
        let bestMatch: any = null;
        
        Object.entries(stepOutputs).forEach(([id, val]) => {
          if (value.startsWith(id)) {
            const differentPart = value.substring(id.length);
            // 检查是否比当前最佳匹配更精确（匹配长度更长）
            if (!bestMatch || id.length > bestMatch.id.length) {
              bestMatch = {
                id,
                value: val,
                differentPart: differentPart.startsWith(".") ? differentPart.substring(1) : differentPart
              };
            }
          }
        });

        const outputsNew = bestMatch ? [{
          key: bestMatch?.id,
          value: bestMatch.value,
          differentPart: bestMatch.differentPart
        }] : [];

      setVariableVal({
        key:outputsNew[0]?.key,
        value,
        addVal: outputsNew[0]?.differentPart,
      });
      form.setFieldValue("addVal", outputsNew[0]?.differentPart);
    }
  }, [stepNodes, stepOutputs, initialVariable]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      onConfirm({
        ...initialVariable,
        value: variableVal?.key + "." + values.addVal,
        addVal: values.addVal,
      });
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="编辑变量"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancelClick}
      className="variable-editor-modal"
      footer={[
        <Button key="cancel" onClick={handleCancelClick}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOk}
        >
          确定
        </Button>,
      ]}
    >
      <p>您可以通过输入来取出变量的部分内容</p>
      <Form
        form={form}
        layout="vertical"
        style={{ display: "flex", alignItems: "center" }}
      >
        <Form.Item noStyle>
          <span style={{ color: "#096DD9" }}>
            <VariableItem
              value={`{{${variableVal?.key || variableVal?.value}}}`}
              variable={variableVal}
            />
            .
          </span>
          <Form.Item
            name="addVal"
            style={{ display: "inline-block", margin: "0 0 0 6px" }}
          >
            <Input placeholder="请输入" style={{ width: "200px" }} />
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  );
};
