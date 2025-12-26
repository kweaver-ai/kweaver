import { useRef, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { EditOutlined } from '@ant-design/icons';

import { Text, Button, EmptyContent } from '@/common';
import WangEditor from '@/common/WangEditor';

const EmptyContentDescription = (props: { onClick: () => void }) => {
  const { onClick } = props;

  return (
    <div className={classNames('g-flex-column-center')}>
      <Text strong={6}>暂无介绍</Text>
      <Text className='g-mt-2'>完善评测数据介绍并上传评测数据</Text>
      <Button className='g-mt-3' type='primary' onClick={onClick}>
        完善评测数据介绍
      </Button>
    </div>
  );
};

const DESCRIPTION_TEMPLATE = `<h2>入门</h2><p><span style="color: rgb(233, 233, 233);"><u> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</u></span></p><h3></h3><h3>数据集介绍</h3><p>为了让您轻松开始使用数据集，支持用户编写数据集的介绍及整体描述。使用下方模板。</p><p><br></p><h3>文件与版本</h3><p>如果您是该数据集的创建者或者有对应的权限，单击“文件与版本 &gt;上传”，支持上传单文件、多文件和文件夹等形式。</p><p><br></p><h3>设置</h3><p>您只能对自己拥有或管理的数据集进行管理设置操作。单击“设置”，在这里您可以编辑数据集的名称、描述及图标颜色。您也可以在此页面删除数据集。</p><p><br></p><p><br></p><h2>版本说明</h2><h3><span style="color: rgb(233, 233, 233);"><u> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </u></span></h3><h3></h3><h3>数据集描述</h3><p>提供对于数据集的介绍及整体描述。支持的使用场景（包括支持的语言等）。</p><p><br></p><h3>数据集支持的任务</h3><p>该数据集支持的训练任务，以及相关benchmark结果。（如：可用于自定义数据集下的模型验证和性能评估等。）</p><p><br></p><h3>数据集的格式和结构</h3><p>对数据的格式进行描述，包括数据的schema，以及提供必要的数据样本示范。</p><p>如果数据集内含多个子数据集的话，每个字数据集都应该提供相对应的数据格式描述。</p><p><br></p><h3>数据集版权信息</h3><p>数据集相关的版权信息，授权使用的场景和用户。是否开源，以及采用哪个开源协议等等。</p><p><br></p><h3>引用</h3><p>数据集是否有相关联的文章，以及如果在研究论文中要引用该数据集是否有推荐的引用格式等等。</p><p><br></p><h3>其他相关信息</h3><p>该数据集可能包含的个人和敏感信息，使用数据集需要考虑的相关背景；</p><p>数据集可能包含的社会意义以及其中可能包含的bias信息和可能的局限性等等。</p>`;

const Description = (props: any) => {
  const { description, detailContentHeight } = props;

  const eitorRef = useRef(null);

  const [editValue, setEditValue] = useState(description);
  const [editType, setEditType] = useState<'preview' | 'edit'>('preview');

  const onChangeType = (type: 'preview' | 'edit') => setEditType(type);

  /** 初始化评测数据集介绍 */
  const initDescription = () => {
    setEditType('edit');
    setEditValue(_.cloneDeep(DESCRIPTION_TEMPLATE));
  };

  const onChange = (value: string) => {
    setEditValue(value);
  };

  /** 保存 */
  const onSave = () => {
    setEditType('preview');
  };

  /** 恢复默认模板 */
  const onReplyTemplate = () => {
    setEditValue(_.cloneDeep(DESCRIPTION_TEMPLATE));
  };

  /** 取消编辑 */
  const onCancel = () => {
    setEditType('preview');
    setEditValue(description);
  };

  const footerHeight = 32 + 20;
  const editorToolbarHeight = 40;
  const offsetHeight = editorToolbarHeight + footerHeight + 4;

  return (
    <div>
      {editValue && editType === 'preview' && (
        <div style={{ textAlign: 'right' }}>
          <Button type='primary' ghost icon={<EditOutlined />} onClick={() => onChangeType('edit')}>
            编辑评测数据集介绍
          </Button>
        </div>
      )}

      {editValue ? (
        <WangEditor
          placeholder='[暂无内容]'
          ref={eitorRef}
          value={editValue}
          type={editType}
          onChange={onChange}
          {...(editType === 'edit' ? { height: detailContentHeight - offsetHeight } : {})}
        />
      ) : (
        <EmptyContent type='fileEmpty' styles={{ container: { marginTop: 60 } }} description={<EmptyContentDescription onClick={initDescription} />} />
      )}
      {editType === 'edit' && (
        <div className='g-mt-5 g-flex-align-center'>
          <Button className='g-mr-2' type='primary' onClick={onSave}>
            保存
          </Button>
          <Button className='g-mr-2' onClick={onReplyTemplate}>
            恢复默认模板
          </Button>
          <Button className='g-mr-2' onClick={onCancel}>
            取消
          </Button>
        </div>
      )}
    </div>
  );
};

export default Description;
