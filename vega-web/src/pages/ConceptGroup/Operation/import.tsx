import { useRef } from 'react';
import intl from 'react-intl-universal';
import { Checkbox, Upload } from 'antd';
import Cookie from '@/utils/cookie';
import api from '@/services/concept-group';
import HOOKS from '@/hooks';
import { Button, IconFont } from '@/web-library/common';

interface ImportComProps {
  callback: () => void;
  knId: string;
}

const ImportCom = (props: ImportComProps) => {
  const { message, modal } = HOOKS.useGlobalContext();
  const { callback, knId } = props;
  const modalContextRef = useRef<any>(null);
  const skipRef = useRef<{
    skip: boolean;
    checked: string;
  }>({
    skip: false,
    checked: '',
  });

  const confirm = async (val: 'ignore' | 'overwrite', modalContext: any, jsonData: any): Promise<void> => {
    if (val) {
      skipRef.current.checked = val;
    }
    const resConfirm: any = await api.createConceptGroup(knId, { ...jsonData, kn_id: knId, branch: 'main' }, val || skipRef.current.checked);
    modalContext.destroy();
    if (!resConfirm?.error_code) {
      message.success(intl.get('ConceptGroup.importSuccess'));
      skipRef.current = {
        skip: false,
        checked: '',
      };
      await callback();
    } else {
      await changeChecked(resConfirm, jsonData);
    }
  };

  const changeChecked = async (res: { error_code: string; description: string }, jsonData: any): Promise<void> => {
    const errorCodes = [
      'OntologyManager.ConceptGroup.CGIDExisted',
      'OntologyManager.ConceptGroup.CGNameExisted',
      'OntologyManager.ObjectType.ObjectTypeIDExisted',
      'OntologyManager.ObjectType.ObjectTypeNameExisted',
      'OntologyManager.ConceptGroup.CGRelationExisted',
      'OntologyManager.RelationType.RelationTypeIDExisted',
      'OntologyManager.RelationType.RelationTypeNameExisted',
      'OntologyManager.ActionType.ActionTypeIDExisted',
      'OntologyManager.ActionType.ActionTypeNameExisted',
    ];
    if (res?.error_code && errorCodes.includes(res?.error_code) && !skipRef.current.skip) {
      modalContextRef.current = modal.info({
        title: intl.get('Global.tipTitle'),
        content: (
          <>
            {res.description}。{intl.get('ConceptGroup.importConflictTip')}
          </>
        ),
        icon: ' ',
        footer: (
          <div>
            <div style={{ marginTop: 10 }}>
              <Checkbox onChange={() => (skipRef.current.skip = true)}>{intl.get('ConceptGroup.skipSameConflict')}</Checkbox>
            </div>
            <div style={{ display: 'flex', marginTop: 20, justifyContent: 'flex-end' }}>
              <Button type="primary" className="g-mr-2" onClick={() => confirm('overwrite', modalContextRef.current, jsonData)}>
                {intl.get('Global.overwrite')}
              </Button>
              <Button className="g-mr-2" onClick={() => confirm('ignore', modalContextRef.current, jsonData)}>
                {intl.get('Global.ignore')}
              </Button>
              <Button onClick={() => modalContextRef.current.destroy()}>{intl.get('Global.cancel')}</Button>
            </div>
          </div>
        ),
      });
    } else if (res?.error_code && errorCodes.includes(res?.error_code)) {
      confirm('ignore', modalContextRef.current, jsonData);
    } else if (res?.error_code) {
      message.error(res.description);
      skipRef.current = {
        skip: false,
        checked: '',
      };
    } else {
      message.success(intl.get('ConceptGroup.importSuccess'));
      skipRef.current = {
        skip: false,
        checked: '',
      };
      await callback();
    }
  };

  /** 上传逻辑 */
  const changeUpload = async (jsonData: any): Promise<void> => {
    const res: any = await api.createConceptGroup(knId, { ...jsonData, kn_id: knId, branch: 'main' });
    await changeChecked(res, jsonData);
  };

  const uploadProps = {
    name: 'concept_group_file',
    action: '',
    accept: '.json',
    showUploadList: false,
    headers: { 'Accept-Language': Cookie.get('language') || 'zh-cn', 'X-Language': Cookie.get('language') || 'zh-cn' },
    beforeUpload: (file: any): boolean => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          changeUpload(jsonData);
        } catch (error) {
          message.error(intl.get('Global.invalidJsonFile'));
          console.error('Error parsing JSON file:', error);
        }
      };
      return false;
    },
  };

  return (
    <Upload {...uploadProps}>
      <Button icon={<IconFont type="icon-upload" />}>{intl.get('Global.import')}</Button>
    </Upload>
  );
};

export default ImportCom;
