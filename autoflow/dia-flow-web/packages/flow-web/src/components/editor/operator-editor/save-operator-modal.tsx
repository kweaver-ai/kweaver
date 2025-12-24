import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, Space } from "antd";
import { API } from "@applet/common";

const { TextArea } = Input;

export default function SaveOperatorModal({
  isSaveModalOpen,
  closeModal,
  saveOperator,
  value,
}: any) {
  const [categoryType, setCategoryType] = useState<any>([]);
  const [form] = Form.useForm();
  const initialValues = {
    ...value,
    // exec_mode: 'sync'
  };

  const handleCancel = () => {
    closeModal?.();
    form.resetFields();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await API.axios.get(
          `/api/agent-operator-integration/v1/operator/category`
        );
        setCategoryType(data);
        if(!value?.category) form.setFieldValue("category", data[0]?.category_type);
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
  }, []);

  const handleSubmit = async (status: string) => {
    try {
      const values = await form.validateFields();
      saveOperator?.({ ...values, status });
      closeModal?.();
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title="保存算子设置"
      open={isSaveModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          label="算子名称"
          name="title"
          rules={[
            { required: true, message: "请输入算子名称" },
            {
              max: 50,
              message: "最多输入50个字符",
            },
          ]}
        >
          <Input maxLength={50} />
        </Form.Item>

        <Form.Item
          label={<span className="flex items-center">算子描述</span>}
          name="description"
          rules={[
            { required: true, message: "请输入算子描述" },
            {
              max: 255,
              message: "最多输入255个字符",
            },
          ]}
        >
          <TextArea
            rows={4}
            maxLength={255}
            placeholder="请尽量详细描述算子的主要功能和使用场景。描述将展示给用户"
          />
        </Form.Item>

        <Form.Item
          label="算子类型"
          name="category"
          rules={[{ required: true, message: "请选择算子类型" }]}
        >
          <Select defaultValue={categoryType[0]?.category_type}>
            {categoryType?.map((item: any) => (
              <Select.Option
                key={item.category_type}
                value={item.category_type}
              >
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* <Form.Item label="运行方式" name="exec_mode">
          <Select
            defaultValue="sync"
            options={[
              { value: "sync", label: "同步" },
              { value: "async", label: "异步" },
            ]}
          />
        </Form.Item> */}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Space>
            <Button onClick={() => handleSubmit("unpublish")}>保存</Button>
            <Button type="primary" onClick={() => handleSubmit("published")}>
              发布
            </Button>
            <Button onClick={handleCancel}>取消</Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
}
