/**
 * 行动类-查看详情
 */
import { useEffect, useState, FC } from 'react';
import intl from 'react-intl-universal';
import { Tag, Divider, Modal, Spin, Dropdown } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import DataFilterNew from '@/components/DataFilterNew';
import { renderObjectTypeLabel } from '@/components/ObjectSelector';
import ToolParamsTable from '@/components/ToolParamsTable';
import actionApi from '@/services/action';
import ActionType from '@/services/action/type';
import api from '@/services/tool';
import viewImage from '@/assets/images/action/action_view.svg';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Button, IconFont, Drawer } from '@/web-library/common';
import UTILS from '@/web-library/utils';
import styles from './index.module.less';

const getScheduleContent = ({ type, expression }: { type?: ActionType.ActionScheduleTypeEnum; expression?: string }) => {
  if (type === ActionType.ActionScheduleTypeEnum.FixRate && expression) {
    const time = expression.slice(0, -1);
    const unit: string = expression.slice(-1);
    const unitLabels: any = {
      d: intl.get('Global.unitDay'),
      m: intl.get('Global.unitMinute'),
      h: intl.get('Global.unitHour'),
    };
    return intl.get('Action.fixedRate', { time, unit: unitLabels[unit] || '' });
  }

  if (type === ActionType.ActionScheduleTypeEnum.Cron && expression) {
    return intl.get('Action.cronExpression', { expression });
  }

  return '--';
};

interface DetailViewProps {
  atId: string;
  knId: string;
  hasModifyPerm: boolean;
  onClose: () => void;
  onEdit: (data: any) => void;
  onDelete: (data: any) => void;
}

const DetailView: FC<DetailViewProps> = ({ atId, knId, hasModifyPerm, onClose, onEdit, onDelete }: any) => {
  const { message } = HOOKS.useGlobalContext();

  const [tool, setTool] = useState<
    | { type?: string; tool_id?: string; tool_name: string; box_id?: string; box_name?: string; tool_description?: string; mcp_id?: string; mcp_name?: string }
    | undefined
  >(undefined);
  const [data, setData] = useState<any>(undefined);
  const [paramModalVisible, setParamModalVisible] = useState(false);
  const [objectOptions, setObjectOptions] = useState<any[]>([]);

  /** 获取对象列表 */
  const getObjectList = async () => {
    try {
      const result = await SERVICE.object.objectGet(knId, { offset: 0, limit: -1 });
      const objectOptions = _.map(result?.entries, (item) => {
        const { id, name, icon, data_properties, color } = item;
        return {
          value: id,
          name,
          data_properties,
          label: renderObjectTypeLabel({ icon, name, color }),
          detail: item,
        };
      });
      setObjectOptions(objectOptions);
    } catch (error) {
      console.log('getObjectList error: ', error);
    }
  };

  // 请求行动类详情
  useEffect(() => {
    const fetchActionDetail = async () => {
      try {
        const [detail] = await actionApi.getActionTypeDetail(knId, [atId]);
        setData(detail);
      } catch (error: any) {
        if (error?.description) {
          message.error(error.description);
        }
      }
    };

    fetchActionDetail();
  }, []);

  useEffect(() => {
    getObjectList();
  }, []);

  // 请求工具信息
  const fetchToolDetails = async () => {
    if (!data?.action_source) {
      setTool(undefined);
      return;
    }

    const { type, box_id, tool_id, mcp_id, tool_name } = data.action_source;

    try {
      // 根据工具类型获取不同的工具详情
      if (type === 'tool' && box_id && tool_id) {
        const [{ box_name, tools }]: any = await api.getToolBoxDetail(box_id, ['box_name', 'tools']);
        const findTool = tools.find((tool: any) => tool.tool_id === tool_id);

        setTool({
          type,
          box_id,
          box_name,
          tool_id,
          tool_name: findTool?.name,
          tool_description: findTool?.description,
        });
      } else if (type === 'mcp' && mcp_id && tool_name) {
        const { tools: mcpTools } = await api.getMcpTools(mcp_id, { page: 1, page_size: 100, status: 'enabled', all: true });
        const {
          base_info: { name: mcp_name },
        } = await api.getMcpDetail(mcp_id);
        const findTool = mcpTools.find((tool: any) => tool.name === tool_name);

        setTool({
          type,
          mcp_id,
          mcp_name,
          tool_name: findTool?.name,
          tool_description: findTool?.description,
        });
      } else {
        setTool(undefined);
      }
    } catch (error) {
      console.error('获取工具详情失败:', error);
      setTool(undefined);
    }
  };

  useEffect(() => {
    fetchToolDetails();
  }, [data]);

  const contents = [
    {
      label: intl.get('Global.id'),
      content: data?.id,
    },
    {
      label: intl.get('Global.tag'),
      content:
        data?.tags?.length > 0 ? (
          <div className="g-flex" style={{ flexWrap: 'wrap', rowGap: 10, paddingTop: 5 }}>
            {data.tags.map((tag: string) => (
              <Tag className={styles['tag']} title={tag} key={tag}>
                {tag}
              </Tag>
            ))}
          </div>
        ) : (
          '--'
        ),
    },
    {
      label: intl.get('Global.comment'),
      content: data?.comment || <span className="g-c-watermark">{intl.get('Global.noComment')}</span>,
    },
    {
      type: 'divider',
    },
    {
      label: intl.get('Action.actionType'),
      content:
        data?.action_type === ActionType.ActionTypeEnum.Add
          ? intl.get('Global.add')
          : data?.action_type === ActionType.ActionTypeEnum.Delete
            ? intl.get('Global.delete')
            : intl.get('Global.edit'),
    },
    {
      label: intl.get('Action.boundObjectType'),
      content: data?.object_type?.name ? renderObjectTypeLabel(data?.object_type) : '--',
    },
    {
      label: intl.get('Action.triggerCondition'),
      content: data?.condition?.operation ? (
        <div style={{ width: 'fit-content' }}>
          <DataFilterNew
            isFirst
            disabled
            objectOptions={objectOptions}
            value={data.condition}
            level={3}
            maxCount={[10, 10, 10]}
            transformType={UTILS.formatType}
          />
        </div>
      ) : (
        '--'
      ),
    },
    {
      label: intl.get('Action.affectedObjectType'),
      content: data?.affect?.object_type?.name ? renderObjectTypeLabel(data?.affect?.object_type) : '--',
    },
    {
      label: intl.get('Action.affectDescription'),
      content: data?.affect?.comment || <span className="g-c-watermark">{intl.get('Global.noDescription')}</span>,
    },
    {
      label: intl.get('Action.actionResource'),
      content: tool ? (
        <div className={styles['tool']}>
          {/* 根据工具类型显示不同图标 */}
          <IconFont type={tool.type === 'tool' ? 'icon-dip-color-suanzitool' : 'icon-dip-color-suanzi'} style={{ fontSize: 22 }} />
          <div className={styles['text-wrapper']}>
            {/* 提取重复的工具路径字符串 */}
            {(() => {
              const toolPath = `${tool.box_name || tool.mcp_name || '--'}/${tool.tool_name || '--'}`;
              return (
                <div className="g-ellipsis-1" style={{ lineHeight: '20px' }} title={toolPath}>
                  {toolPath}
                </div>
              );
            })()}

            {tool.tool_description ? (
              <div className="g-ellipsis-1" title={tool.tool_description} style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '12px', lineHeight: '18px' }}>
                {tool.tool_description}
              </div>
            ) : (
              <span className="g-c-watermark">{intl.get('Global.noDescription')}</span>
            )}
          </div>
          <Button type="text" style={{ fontSize: '12px', gap: 6 }} onClick={() => setParamModalVisible(true)}>
            <img src={viewImage} />
            {intl.get('Global.detail')}
          </Button>
        </div>
      ) : (
        '--'
      ),
    },
    // { label: '行动监听', content: getScheduleContent({ type: data?.schedule?.type, expression: data?.schedule?.expression }) }
  ];

  return (
    <Drawer
      open
      title={intl.get('Global.actionClass')}
      width={'60%'}
      maskClosable
      onClose={onClose}
      // styles={{
      //   // header: {
      //   //   border: 'none',
      //   // },
      //   body: {
      //     padding: '0 24px 24px 24px',
      //   },
      // }}
      // style={{ backgroundImage: `url(${detailBgImage})`, backgroundRepeat: 'round' }}
    >
      {data ? (
        <div className={styles['detail-view-root']}>
          {data.name ? (
            <div className={classNames('g-flex-align-center', styles['line-height-32'])} style={{ gap: 8 }}>
              <IconFont type="icon-dip-hangdonglei" />
              <span className="g-ellipsis-1" title={data.name} style={{ flex: 1 }}>
                {data.name}
              </span>
              {hasModifyPerm && (
                <>
                  <Button icon={<IconFont type="icon-dip-bianji" />} onClick={() => onEdit(data)}>
                    {intl.get('Global.edit')}
                  </Button>
                  <Dropdown trigger={['click']} menu={{ items: [{ key: 'delete', label: intl.get('Global.delete') }], onClick: () => onDelete(data) }}>
                    <Button icon={<IconFont type="icon-dip-gengduo" />} />
                  </Dropdown>
                </>
              )}
            </div>
          ) : (
            '--'
          )}

          <Divider className={styles['divider']} />

          {contents.map(({ label, content, type }, index) =>
            type === 'divider' ? (
              <Divider key={label || index} className={styles['divider']} />
            ) : (
              <div key={label} className={classNames('g-flex', styles['line-height-32'])} style={{ gap: 10, ...(index === 0 ? {} : { marginTop: 10 }) }}>
                <div style={{ width: 100, flexShrink: 0, color: 'rgba(0, 0, 0, 0.65)' }}>{label}</div>
                {typeof content === 'string' ? (
                  <div style={{ flex: 1 }} className="g-ellipsis-1" title={content}>
                    {content}
                  </div>
                ) : (
                  content
                )}
              </div>
            )
          )}

          {paramModalVisible && (
            <Modal
              open
              centered
              width={850}
              title={intl.get('Action.viewTool', { name: tool?.tool_name })}
              onCancel={() => setParamModalVisible(false)}
              footer={null}
            >
              <ToolParamsTable
                disabled
                actionSource={data.action_source}
                overflowYHeight={500}
                knId={knId}
                obId={data?.object_type?.id}
                value={data?.parameters}
              />
            </Modal>
          )}
        </div>
      ) : (
        <div className={styles['loading']}>
          <Spin />
        </div>
      )}
    </Drawer>
  );
};

export default DetailView;
