import { useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Switch, Tooltip, InputNumber } from 'antd';
import { EditOutlined, QuestionCircleFilled } from '@ant-design/icons';

import ENUMS from '@/enums';
import { Button, Form, Input, Select, MonacoEditor } from '@/common';
import { MODEL_TYPE_OPTIONS, AUTH_OPTIONS } from '../enums';

const MODEL_TYPE_OPTIONS_KV = _.keyBy(MODEL_TYPE_OPTIONS, 'value');
const AUTH_OPTIONS_KV = _.keyBy(AUTH_OPTIONS, 'value');

export type CreateAndEditModalProps = {
  open: boolean;
  type: 'create' | 'edit' | 'view';
  sourceData: any;
  onOk: (type: 'create' | 'edit' | 'view', values: any) => Promise<any>;
  onCancel: () => void;
  onTest?: (values: any, notMessage?: boolean) => Promise<any>;
};

const ADAPTATION_VALUE_OBJECT: any = {
  embedding:
    '"""\r\n1.入口函数必须是main\r\n2.函数仅接受一个参数，参数类型为list[str]\r\n3.函数必须写异步函数async，避免阻塞，调用向量模型服务需要使用aiohttp发送http请求\r\n"""\r\nimport time\r\nimport aiohttp\r\nimport json\r\nimport uuid\r\n\r\nasync def main(texts: list[str]):\r\n    # 调用embedding服务\r\n    url = "http://127.0.0.1:8316/v1/embeddings"\r\n    headers = {\r\n        "Content-Type": "application/json",\r\n        "Authorization": "Bearer **************************"\r\n    }\r\n    payload = {"texts": texts}\r\n\r\n    async with aiohttp.ClientSession() as session:\r\n        async with session.post(url, json=payload, headers=headers) as resp:\r\n            if resp.status != 200:\r\n                raise Exception(f"Embedding API failed with status {resp.status}")\r\n            embeddings = await resp.json()\r\n    # 构建标准openai风格响应体\r\n    response = {\r\n        "object": "list",\r\n        "data": [{\r\n            "object": "embedding",\r\n            "embedding": emb,\r\n            "index": i\r\n        } for i, emb in enumerate(embeddings)],\r\n        "model": "custom",\r\n        "usage": {\r\n            "prompt_tokens": len(texts),\r\n            "total_tokens": len(texts)\r\n        },\r\n        "id": f"infinity-{str(uuid.uuid4())}",\r\n        "created": int(time.time())\r\n    }\r\n    return response',
  reranker:
    '"""\r\n1.入口函数必须是main\r\n2.函数接受两个参数，第一个参数为query字符串，数据类型：str,第二个参数为文档列表，参数类型为list[str]\r\n3.函数必须写异步函数async，避免阻塞，调用向量模型服务需要使用aiohttp发送http请求\r\n"""\r\nimport time\r\nimport aiohttp\r\nimport json\r\nimport uuid\r\n\r\n\r\nasync def main(query: str, documents: list[str]):\r\n    # 调用reranker服务\r\n    url = "http://127.0.0.1:8343/v1/reranker"\r\n    headers = {\r\n        "Content-Type": "application/json",\r\n        "Authorization": "Bearer **************************"\r\n    }\r\n    payload = {\r\n        "query": query,\r\n        "slices": documents\r\n    }\r\n\r\n    async with aiohttp.ClientSession() as session:\r\n        async with session.post(url, json=payload, headers=headers) as resp:\r\n            if resp.status != 200:\r\n                raise Exception(f"Reranker API failed with status {resp.status}")\r\n            scores = await resp.json()\r\n    # 构建标准openai风格响应体\r\n    response = {\r\n        "object": "rerank",\r\n        "results": sorted([\r\n            {\r\n                "relevance_score": score,\r\n                "index": idx,\r\n                "document": None\r\n            } for idx, score in enumerate(scores)\r\n        ], key=lambda x: x["relevance_score"], reverse=True),\r\n        "model": "custom",\r\n        "usage": {\r\n            "prompt_tokens": len(query) + sum(len(d) for d in documents),\r\n            "total_tokens": len(query) + sum(len(d) for d in documents)\r\n        },\r\n        "id": f"infinity-{str(uuid.uuid4())}",\r\n        "created": int(time.time())\r\n    }\r\n    return response',
};

const Dot = () => {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, background: 'rgba(255,255,255, 1)', marginLeft: 12, marginRight: 4 }} />;
};

const rulesConfig = (keys: string[], maxInput = 50) => {
  const rules = {
    required: { required: true, message: intl.get('global.cannotBeNull') },
    max: { max: maxInput, message: intl.get('global.lenErr', { len: maxInput }) },
    posInt: { pattern: ENUMS.REGEXP.POS_INT, message: intl.get('global.onlyPosInt') },
    onlyKeyboard: { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
  };

  return _.map(keys, (key: string) => rules[key as keyof typeof rules]);
};

/** 创建和编辑表单 */
const CreateAndEditForm = (props: any) => {
  const { form, type, sourceData = {}, onToEdit } = props;

  const authValue = Form.useWatch('auth', form);
  const modelTypeValue = Form.useWatch('model_type', form);
  const adapterValue = Form.useWatch('adapter', form);

  useEffect(() => {
    if (!adapterValue) return;
    form.setFieldValue('adapter_code', ADAPTATION_VALUE_OBJECT[modelTypeValue]);
  }, [adapterValue]);

  useEffect(() => {
    const adapter_code = sourceData?.adapter_code ? sourceData.adapter_code : ADAPTATION_VALUE_OBJECT[modelTypeValue];
    form.setFieldValue('adapter_code', adapter_code);
  }, [modelTypeValue]);

  const isView = type === 'view';
  // const isViewOrEdit = type === 'view' || type === 'edit';

  return (
    <Form
      name='largeModelCreateAndEditModal'
      form={form}
      labelAlign='left'
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 19 }}
      colon={type === 'view'}
      initialValues={{ model_type: 'embedding', auth: sourceData?.api_key ? 'auth' : 'empty', ...sourceData }}
    >
      <Form.ViewOrEditItem
        name='model_name'
        label={intl.get('ModelManagement.modal.modelName')}
        view={isView}
        viewRender={value => (
          <div className='g-flex-align-center' title={value}>
            <div className='g-ellipsis-1'>{value}</div>
            <Button.Icon className='g-ml-2' icon={<EditOutlined title={intl.get('global.edit')} />} onClick={onToEdit} />
          </div>
        )}
        rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}
      >
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>
      {/* 模型类型 */}
      <Form.ViewOrEditItem
        name='model_type'
        label={intl.get('ModelManagement.modal.modelType')}
        view={isView}
        rules={rulesConfig(['required'])}
        getFieldValue={fieldValue => MODEL_TYPE_OPTIONS_KV[fieldValue]?.label}
      >
        <Select options={MODEL_TYPE_OPTIONS} getPopupContainer={triggerNode => triggerNode.parentNode} />
      </Form.ViewOrEditItem>
      {/* 适配器 */}
      <Form.ViewOrEditItem name='adapter' label={<span style={{ marginLeft: 11 }}>{intl.get('ModelManagement.modal.adaptationFile')}</span>}>
        <Switch disabled={isView} />
      </Form.ViewOrEditItem>
      <Form.ViewOrEditItem name='api_model' label='API Model' view={isView} isVisible={!adapterValue} rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}>
        <Input.Spell placeholder={`${intl.get('global.pleaseEnter')}${intl.get('ModelManagement.modal.attentionUppercaseAndLowercase')}`} />
      </Form.ViewOrEditItem>
      <Form.ViewOrEditItem name='api_url' label='API URL' view={isView} isVisible={!adapterValue} rules={rulesConfig(['required', 'max', 'onlyKeyboard'], 400)}>
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>
      <Form.ViewOrEditItem
        name='auth'
        label={intl.get('ModelManagement.modal.auth')}
        view={isView}
        isVisible={!adapterValue}
        rules={rulesConfig(['required'])}
        getFieldValue={fieldValue => AUTH_OPTIONS_KV[fieldValue]?.label}
      >
        <Select options={AUTH_OPTIONS} getPopupContainer={triggerNode => triggerNode.parentNode} />
      </Form.ViewOrEditItem>
      <Form.ViewOrEditItem
        name='api_key'
        label='API Key'
        view={isView}
        isVisible={authValue === 'auth' && !adapterValue}
        rules={rulesConfig(['required', 'onlyKeyboard'])}
      >
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>
      <Form.ViewOrEditItem
        name='adapter_code'
        colon={false}
        label={<span />}
        labelCol={{ span: 5 }}
        isVisible={adapterValue === true}
        style={{ marginTop: -16 }}
      >
        <MonacoEditor.Adaptation
          width={580}
          height={260}
          placeholder={intl.get('global.pleaseEnter')}
          defaultLanguage='python'
          options={{ border: true, readOnly: isView }}
        />
      </Form.ViewOrEditItem>
      {/* 向量维度 */}
      <Form.ViewOrEditItem
        name='embedding_dim'
        label={intl.get('ModelManagement.modal.vectorDimension')}
        view={isView}
        isVisible={modelTypeValue === 'embedding'}
        rules={rulesConfig(['required'])}
      >
        <InputNumber className='g-w-100' placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>
      {/* 批次大小  & 最大Document数量 */}
      <Form.ViewOrEditItem
        name='batch_size'
        label={
          <span>
            {modelTypeValue === 'embedding' ? intl.get('ModelManagement.modal.batchSize') : intl.get('ModelManagement.modal.maxNumberOfDocuments')}
            {modelTypeValue === 'embedding' && (
              <Tooltip
                title={
                  <div>
                    <div>{intl.get('ModelManagement.modal.batchSizeTip1')}</div>
                    <div>{intl.get('ModelManagement.modal.batchSizeTip2')}</div>
                    <div className='g-flex-align-center'>
                      <Dot />
                      {intl.get('ModelManagement.modal.batchSizeTip3')}
                    </div>
                  </div>
                }
              >
                <QuestionCircleFilled style={{ marginLeft: 8, color: 'rgba(0,0,0,.4)' }} />
              </Tooltip>
            )}
          </span>
        }
        view={isView}
        rules={rulesConfig(['required'])}
      >
        <InputNumber className='g-w-100' placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>
      {/* 单次最大处理Token数 */}
      <Form.ViewOrEditItem
        name='max_tokens'
        label={intl.get('ModelManagement.modal.maxNumberOfTokens')}
        view={isView}
        isVisible={modelTypeValue === 'embedding'}
        rules={rulesConfig(['required'])}
      >
        <InputNumber className='g-w-100' placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>
    </Form>
  );
};

export default CreateAndEditForm;
