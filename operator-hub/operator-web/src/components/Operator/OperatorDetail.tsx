import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout, message } from 'antd';
import './style.less';
import { getOperatorInfo, getOperatorMarketInfo } from '@/apis/agent-operator-integration';
import { OperateTypeEnum, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import OperatorInfo from '../Operator/OperatorInfo';
import DebugResult from '../OperatorList/DebugResult';
import DetailHeader from '../OperatorList/DetailHeader';
import { postResourceOperation } from '@/apis/authorization';

const { Content } = Layout;

export default function OperatorDetail() {
  const [searchParams] = useSearchParams();
  const operator_id = searchParams.get('operator_id') || '';
  const action = searchParams.get('action') || '';
  const [operatorInfo, setOperatorInfo] = useState<any>({});
  const [permissionCheckInfo, setIsPermissionCheckInfo] = useState<Array<PermConfigTypeEnum>>();

  useEffect(() => {
    fetchInfo({});
    resourceOperation();
  }, []);
  const fetchInfo = async (data?: any) => {
    try {
      const params = {
        operator_id,
      };
      const data =
        action === OperateTypeEnum.View ? await getOperatorMarketInfo(params) : await getOperatorInfo(params);
      setOperatorInfo(data);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const resourceOperation = async () => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: operator_id,
            type: OperatorTypeEnum.Operator,
          },
        ],
      });
      setIsPermissionCheckInfo(data?.[0]?.operation);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="operator-detail">
      <DetailHeader
        type={OperatorTypeEnum.Operator}
        detailInfo={{ ...operatorInfo, description: operatorInfo?.metadata?.description }}
        fetchInfo={fetchInfo}
        permissionCheckInfo={permissionCheckInfo}
      />
      <Layout style={{ padding: '16px', background: '#f5f5f5' }}>
        {/* 右侧内容区域 */}
        <Content style={{ background: 'white', borderRadius: '8px' }}>
          <OperatorInfo selectedTool={operatorInfo} />
          {permissionCheckInfo?.includes(PermConfigTypeEnum.Execute) && (
            <DebugResult
              selectedTool={operatorInfo}
              type={OperatorTypeEnum.Operator}
              permissionCheckInfo={permissionCheckInfo}
            />
          )}
        </Content>
      </Layout>
    </div>
  );
}
