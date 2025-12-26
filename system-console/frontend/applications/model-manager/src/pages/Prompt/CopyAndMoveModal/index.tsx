import { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import ENUMS from '@/enums';
import { Modal, Tree, Form, Input } from '@/common';

type CopyAndMoveModalProps = {
  open: boolean;
  type: 'copy' | 'move';
  sourceData: any;
  promptFolder: any;
  onOk: (values: any) => Promise<any>;
  onCancel: () => void;
};
const CopyAndMoveModal = (props: CopyAndMoveModalProps) => {
  const { open, type, sourceData, promptFolder, onOk: props_onOk, onCancel } = props;
  const [form] = Form.useForm();
  const [isFetching, setIsFetching] = useState(false);

  const [treeData, setTreeData] = useState<any>([]);
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>([]);
  useEffect(() => {
    const newTreeSelectData: any = [];
    const traversalItems: any = (items: any, parentData: any) => {
      if (_.isEmpty(items)) return;
      return _.map(items, item => {
        const { id, name, type } = item;
        const key = parentData ? `${parentData._key}-${id}` : id;
        item._key = key;
        if (parentData) {
          // 把parent的数据加入节点
          const _parentData = _.cloneDeep(parentData);
          delete _parentData.children;
          item._parentData = _parentData;
        }

        const temp: any = {
          key,
          type,
          sourceData: item,
          title: <Tree.FolderAndDocumentTitle type={type} title={name} hasSwitcherIcon={!!item?.children?.length} operate={null} />,
        };
        if (item.children) temp.children = traversalItems(item.children, item);
        if (!parentData) newTreeSelectData.push(temp);

        return temp;
      });
    };

    traversalItems(_.cloneDeep(_.slice(promptFolder, 1)));

    const initExpandedKeys = newTreeSelectData[0].key;
    const initProject = newTreeSelectData[0]?.children?.[0]?.key;
    setTreeExpandedKeys([initExpandedKeys]);
    setTreeData(newTreeSelectData);
    form.setFieldValue('project', initProject);
  }, [JSON.stringify(promptFolder)]);

  const onOk = () => {
    if (!props_onOk) return;
    form.validateFields().then(async (values: any) => {
      try {
        setIsFetching(true);
        await props_onOk(values);
        onCancel();
      } finally {
        setIsFetching(false);
      }
    });
  };

  return (
    <Modal
      open={open}
      width={640}
      title={type === 'move' ? intl.get('Prompt.modal.movePrompt') : intl.get('Prompt.modal.copyPrompt')}
      confirmLoading={isFetching}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form
        name='prompt-create-and-edit-project-modal-form'
        form={form}
        layout='vertical'
        initialValues={{ name: `${sourceData.name}${intl.get('Prompt.modal.theCopy')}` }}
      >
        {type === 'copy' && (
          <Form.Item
            name='name'
            label={intl.get('Prompt.modal.promptName')}
            rules={[
              { required: true, message: intl.get('global.cannotBeNull') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
              { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
            ]}
          >
            <Input.Spell style={{ width: '100%' }} placeholder={intl.get('global.pleaseEnter')} />
          </Form.Item>
        )}
        <Form.Item name='project' label={intl.get('Prompt.modal.selectGroup')} rules={[{ required: true, message: intl.get('global.cannotBeNull') }]}>
          <Tree.FolderAndDocumentSelect
            placeholder={intl.get('global.pleaseEnter')}
            treeData={treeData}
            expandedKeys={treeExpandedKeys}
            onExpand={(keys: any[]) => setTreeExpandedKeys(keys)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default (props: CopyAndMoveModalProps) => (props.open ? <CopyAndMoveModal {...props} /> : null);
