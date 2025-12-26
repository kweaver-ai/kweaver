import { useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Tabs } from 'antd';

import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Drawer, Steps, Button } from '@/common';

import BasicInformation from './BasicInformation';
import MemberManagement from './MemberManagement';

import styles from './index.module.less';

const drawerName: any = { create: 'name_create', edit: 'name_edit', view: 'name_view' };
const CreateAndEditDrawer = (props: any) => {
  const { message } = HOOKS.useGlobalContext();
  const { open, type, step = 0, source, onRefresh, onCancel: props_onCancel } = props;

  const [loading, setLoading] = useState(false);
  const [createComplete, setCreateComplete] = useState(false);
  const [stepsCurrent, setStepsCurrent] = useState(step); // 当前步骤
  const [errorData, setErrorData] = useState({ name: '' });
  const [basicForm] = Form.useForm();
  const memberValue = useRef({});
  const domainData = useRef<any>(source);

  // useEffect(() => {
  //     if (type === 'edit' && source?.id) getDomainDetail();
  // }, [source?.id]);

  // const getDomainDetail = async () => {
  //     try {
  //         const result = await SERVICE.businessDomain.businessDomainGetById(source?.id);
  //         console.log('result', result);
  //     } catch (error: any) {
  //         message.error(error?.data?.message);
  //     }
  // };

  const onChangeError = (value: any) => {
    setErrorData({ ..._.cloneDeep(errorData), ...value });
  };

  /** 下一步 */
  const onNext = () => {
    setStepsCurrent(stepsCurrent + 1);
    setCreateComplete(true);
  };

  /** 关闭侧边栏 */
  const onCancel = () => {
    if (createComplete) onRefresh();
    props_onCancel();
  };

  /** 创建和编辑弹窗-保存 */
  const onOk = async (values: any) => {
    try {
      setLoading(true);
      if (type === 'edit') {
        await SERVICE.businessDomain.businessDomainUpdate(source?.id, values);
        message.success(intl.get('businessDomain.drawer.businessDomainEditSuccessfully'));
        onRefresh();
        props_onCancel();
      } else {
        domainData.current = await SERVICE.businessDomain.businessDomainCreate(values);
        message.success(intl.get('businessDomain.drawer.businessDomainCreatedSuccessfully'));
        onNext();
      }
      setLoading(false);
    } catch (error: any) {
      if (error.status === 409 && error?.data?.code === 3) {
        setErrorData({ name: intl.get('businessDomain.drawer.businessDomainNameAlreadyExists') });
      } else {
        message.error(error?.data?.message);
      }

      setLoading(false);
    }
  };

  const StepsContent: any = {
    0: {
      content: <BasicInformation form={basicForm} values={domainData} errorData={errorData} onChangeError={onChangeError} />,
      nextText: intl.get('global.Ok'),
      nextClick: () => {
        basicForm.validateFields().then(async values => {
          await onOk(values);
        });
      },
    },
    1: {
      content: <MemberManagement type={type} memberValue={memberValue} domainData={domainData} />,
      nextText: intl.get('global.Ok'),
      nextClick: async () => {
        const id = domainData.current?.id;

        const add: any = [];
        const update: any = [];
        const remove: any = [];
        _.forEach(memberValue.current, (item: any) => {
          const { id, type, role, name, old_role } = item;
          if (item?.__type === 'add') add.push({ id, type, role, name });
          if (item?.__type === 'update') update.push({ id, type, role, name, old_role });
          if (item?.__type === 'remove') remove.push({ id, type, name });
        });
        try {
          setLoading(true);
          await SERVICE.businessDomain.businessDomainMembersUpdate(id, { add, update, remove });
          message.success(intl.get('businessDomain.drawer.authorizationSuccessful'));
          setLoading(false);
          onCancel();
        } catch (error: any) {
          setLoading(false);
          message.error(error?.data?.message);
        }
      },
    },
  };

  const items: any[] = [
    { label: intl.get('businessDomain.drawer.basicInformation'), key: 0 },
    { label: intl.get('businessDomain.drawer.authorizationManagement'), key: 1 },
  ];
  const onClick: any = (key: number) => {
    setStepsCurrent(key);
  };

  return (
    <Drawer
      open={open}
      title={`${intl.get(`businessDomain.drawer.${drawerName[type]}`)} ${type === 'edit' ? `- ${source?.name}` : ''}`}
      width={800}
      destroyOnHidden={true}
      onClose={onCancel}
    >
      <div className={styles.header} style={{ padding: type === 'edit' ? '0' : '0 40px' }}>
        {type === 'edit' ? (
          <Tabs items={items} size='small' defaultActiveKey={step} style={{ marginTop: -12 }} onChange={onClick} />
        ) : (
          <Steps
            current={stepsCurrent}
            items={[{ title: intl.get('businessDomain.drawer.basicInformation') }, { title: intl.get('businessDomain.drawer.businessDomainAuthorization') }]}
          />
        )}
      </div>
      <div className={styles.content}>{StepsContent?.[stepsCurrent]?.content}</div>
      <div className={styles.footer}>
        <Button className='g-mr-2' type='primary' loading={loading} onClick={StepsContent?.[stepsCurrent]?.nextClick}>
          {StepsContent?.[stepsCurrent]?.nextText}
        </Button>
        <Button disabled={loading} onClick={onCancel}>
          {intl.get('global.Cancel')}
        </Button>
      </div>
    </Drawer>
  );
};

export default CreateAndEditDrawer;
