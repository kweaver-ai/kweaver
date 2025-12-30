import React, { useState, useEffect, useMemo, useCallback } from 'react';
import intl from 'react-intl-universal';
import { Button, Table, Space, message } from 'antd';
import { RightOutlined, FormOutlined, DeleteOutlined } from '@ant-design/icons';
import ToolBoxIcon from '@/assets/images/tool-mcp.svg';
import ToolIcon from '@/assets/images/toolIcon.svg';
import AddToolModal from '../AddToolModal';
import { getToolBoxMarketList, getBoxToolList } from '@/apis/agent-operator-integration';
import styles from '../ConfigSection.module.less';
import classNames from 'classnames';
import EditToolModal from '@/components/Tool/EditToolModal';
import _ from 'lodash';

// 工具箱详情接口
interface ToolBoxInfo {
  box_name: string;
  box_desc: string;
}

// 扩展技能项接口，匹配实际使用场景
interface SkillItem {
  // 基本属性 - 与API契约一致
  tool_type: string;
  tool_id: string;
  box_id: string;
  description?: string;
  use_rule?: string;
  tool_input?: Array<{
    enable: boolean;
    input_name: string;
    input_type: string;
    map_type: string;
    map_value: any;
  }>;
  intervention?: boolean;
  data_source_config?: any;
  llm_config?: any;

  // 用于UI展示的扩展属性
  id?: string;
  tool_name?: string; // 技能名称
  box_name?: string; // 工具箱名称
  icon?: React.ReactNode;
  agent_version?: string; // Agent版本

  // 树状结构支持
  children?: SkillItem[];
  isServerNode?: boolean; // 标识是否为MCP服务器节点
  isToolBoxNode?: boolean; // 标识是否为工具箱节点

  details?: any;
}

interface SkillsSectionProps {
  state?: any;
  // 只读模式下的技能
  viewSkills?: any;
  updateSkills?: any;
  stateSkills?: any;
  duplicateCountError?: any;
}

const SkillsSection = (props: SkillsSectionProps) => {
  const { state, viewSkills, updateSkills, stateSkills, duplicateCountError } = props;

  // 添加工具箱详情的状态管理
  const [toolBoxDetails, setToolBoxDetails] = useState<Record<string, ToolBoxInfo>>({});
  // 添加工具详情的状态管理
  const [toolDetails, setToolDetails] = useState<Record<string, any>>({});

  const [editToolModal, setEditToolModal] = useState(false);
  const [editSelectedTool, setEditSelectedTool] = useState([]);
  const [nameCounts, setNameCounts] = useState({});
  const [duplicateCount, setDuplicateCount] = useState(0);

  // 将skills的各个部分合并为一个用于显示的数组
  const allSkills = useMemo(() => {
    const result: SkillItem[] = [];

    // 添加工具
    if (stateSkills?.length) {
      stateSkills.forEach((tool: any) => {
        result.push({
          ...tool,
          tool_type: 'tool',
        });
      });
    }

    return result;
  }, [stateSkills, viewSkills]);

  const [skills, setSkills] = useState<SkillItem[]>(allSkills);
  const [toolModalVisible, setToolModalVisible] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  // 获取工具箱详情的函数
  const fetchToolBoxDetails = useCallback(async (toolBoxIds: string[]) => {
    try {
      // 使用批量接口获取所有工具箱信息
      const response = await getToolBoxMarketList({
        box_ids: toolBoxIds,
        fields: 'box_name,box_desc',
      });

      const detailsMap: Record<string, ToolBoxInfo> = {};

      response.forEach(toolBox => {
        detailsMap[toolBox.box_id] = {
          box_name: toolBox.box_name || intl.get('dataAgent.config.toolboxWithId', { id: toolBox.box_id }),
          box_desc: toolBox.box_desc || intl.get('dataAgent.config.toolboxDescription'),
        };
      });

      setToolBoxDetails(prev => ({ ...prev, ...detailsMap }));
    } catch (error) {
      console.error('获取工具箱详情失败:', error);

      // 失败时使用默认值
      const detailsMap: Record<string, ToolBoxInfo> = {};
      toolBoxIds.forEach(toolBoxId => {
        detailsMap[toolBoxId] = {
          box_name: intl.get('dataAgent.config.toolboxWithId', { id: toolBoxId }),
          box_desc: intl.get('dataAgent.config.toolboxDescription'),
        };
      });
      setToolBoxDetails(prev => ({ ...prev, ...detailsMap }));
    }
  }, []);

  // 获取工具箱内工具详情的函数
  const fetchToolBoxToolDetails = useCallback(async (toolBoxId: string) => {
    try {
      const response = await getBoxToolList(toolBoxId, {
        all: true, // 获取所有工具
      });

      const toolsMap: Record<string, any> = {};
      response.tools.forEach(tool => {
        toolsMap[tool.tool_id] = {
          tool_name: tool.name,
          description: tool.description,
        };
      });

      setToolDetails(prev => ({ ...prev, ...toolsMap }));
    } catch (error) {
      console.error(`获取工具箱 ${toolBoxId} 工具详情失败:`, error);
    }
  }, []);

  // 监听MCP服务器变化，获取详情信息
  useEffect(() => {
    // 获取工具箱详情
    const toolBoxIds = Array.from(
      new Set(skills.filter(skill => skill.tool_type === 'tool').map(skill => skill.box_id))
    );

    if (toolBoxIds.length > 0) {
      setToolBoxDetails(currentDetails => {
        const missingToolBoxIds = toolBoxIds.filter(id => !currentDetails[id]);
        if (missingToolBoxIds.length > 0) {
          fetchToolBoxDetails(missingToolBoxIds);
        }
        return currentDetails;
      });
    }
  }, [skills, fetchToolBoxDetails]);

  // 处理技能数据，将工具按工具箱分组、MCP工具按服务器分组为树状结构
  const processedSkills = useMemo(() => {
    if (!skills?.length) return [];
    // 分离不同类型的工具
    const tools: any = skills.filter(skill => skill.tool_type === 'tool');

    const result: SkillItem[] = [];

    // 处理普通工具 - 按工具箱分组
    if (tools.length > 0) {
      const toolBoxes = new Map<string, SkillItem[]>();

      tools.forEach(tool => {
        const toolBoxId = tool.box_id;
        if (!toolBoxes.has(toolBoxId)) {
          toolBoxes.set(toolBoxId, []);
        }

        // 使用工具详情信息（如果已获取）
        const toolDetail = tools[tool.tool_id];
        const enhancedTool = {
          ...tool,
          tool_name: toolDetail?.tool_name || tool.tool_name,
          description: toolDetail?.description || tool.description,
        };

        toolBoxes.get(toolBoxId)!.push(enhancedTool);
      });

      // 创建工具箱树状节点
      const toolBoxNodes: SkillItem[] = Array.from(toolBoxes.entries()).map(([toolBoxId, toolList]) => {
        // 使用获取到的工具箱详情，如果没有则使用默认值
        const toolBoxInfo = tools[toolBoxId];
        const toolBoxName = toolBoxInfo?.box_name || toolList[0]?.box_name;
        const toolBoxDesc = toolBoxInfo?.box_desc;
        return {
          tool_type: 'tool-box',
          tool_id: `tool-box-${toolBoxId}`,
          box_id: toolBoxId,
          tool_name: toolBoxName,
          description: toolBoxDesc,
          isToolBoxNode: true,
          // 名称不存在时，children设置为undefined
          children: toolBoxName ? toolList : undefined,
        };
      });

      result.push(...toolBoxNodes);
    }
    return result;
  }, [skills, toolBoxDetails, toolDetails]);

  // 技能表格列定义
  const skillColumns = [
    {
      title: '工具名称',
      dataIndex: 'tool_name',
      key: 'tool_name',
      width: 300, // 设置固定宽度
      fixed: 'left',
      onCell: () => ({
        style: { display: 'flex', alignItems: 'center' },
      }),
      render: (text: string, record: SkillItem) => {
        let Icon, IconPadding, IconSize;
        if (record.tool_type === 'tool-box') {
          Icon = ToolBoxIcon; // 工具箱使用工具箱图标
          IconSize = '32px';
          IconPadding = '0';
        } else if (record.tool_type === 'tool') {
          Icon = ToolIcon; // MCP工具和普通工具使用工具图标
          IconSize = '32px';
          IconPadding = '6px 0';
        }

        return (
          <div className={classNames(styles['skill-name-cell'], 'dip-ellipsis')}>
            <Icon
              style={{
                width: IconSize,
                height: IconSize,
                minWidth: IconSize,
                padding: IconPadding,
              }}
            />
            <span
              className={classNames('dip-ellipsis', {
                'dip-text-color-error': !text || nameCounts[text] > 1,
              })}
              title={text}
              style={{ maxWidth: '200px' }}
            >
              {text || '---'}
            </span>
          </div>
        );
      },
    },
    {
      title: '工具描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: SkillItem) => {
        // 名称不存在，描述显示---
        const desc = record.tool_name ? text : '---';
        return (
          <div className={styles['skill-role']}>
            <div
              className={classNames(styles['skill-description'], 'dip-ellipsis', {
                'dip-text-color-error': desc === '---',
              })}
              title={desc}
            >
              {desc || intl.get('dataAgent.config.noSkillDescription')}
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right',
      render: (_: any, record: SkillItem) => {
        return (
          <Space size="middle" className={styles['skill-actions']}>
            {/* 普通工具和Agent显示配置按钮，工具箱和MCP服务器不显示 */}
            {record.tool_type === 'tool' && !record.isToolBoxNode ? (
              <Button
                className="dip-c-subtext"
                type="text"
                icon={<FormOutlined />}
                onClick={e => {
                  e.stopPropagation();
                  setEditSelectedTool({ ...record, name: record?.tool_name });
                  setEditToolModal(true);
                  // configureSkill(record);
                }}
              />
            ) : null}

            <Button
              className="dip-c-subtext"
              type="text"
              icon={<DeleteOutlined />}
              onClick={e => {
                e.stopPropagation();
                deleteSkill(record.tool_id);
              }}
            />
          </Space>
        );
      },
    },
  ];

  // 处理添加技能
  const handleAddSkill = () => {
    setToolModalVisible(true);
    setIsExpanded(true);
  };

  const changeToolDetails = (data?: any) => {
    // 过滤掉与 tool_id 相同的元素
    const filteredArray = _.filter(skills, item => item.tool_id !== data.tool_id);
    const seenNames = filteredArray.some(item => item.tool_name === data?.name);
    if (seenNames) {
      setEditToolModal(true);
      message.error(`工具名称"${data?.name}"已存在`);
      return false;
    }
    const updatedSkills = [...skills];
    const itemIndex = _.findIndex(updatedSkills, { box_id: data.box_id, tool_id: data.tool_id });

    if (itemIndex !== -1) {
      // 修改拷贝后的数组元素
      updatedSkills[itemIndex] = {
        ...updatedSkills[itemIndex],
        tool_name: data?.name,
        description: data?.description,
        use_rule: data?.use_rule,
      };
    }

    setSkills(updatedSkills);
    updateSkills(updatedSkills);
    duplicateName(updatedSkills);
  };

  // 删除技能
  const deleteSkill = (id: string) => {
    let updatedSkills: any;
    // 如果删除的是工具箱节点，需要删除该工具箱下的所有工具
    if (id.startsWith('tool-box-')) {
      const toolBoxId = id.replace('tool-box-', '');
      updatedSkills = skills.filter(skill => !(skill.tool_type === 'tool' && skill.box_id === toolBoxId));
      message.success('该工具箱及其所有工具已删除');
    } else {
      // 删除其他类型的工具（MCP工具不会到这里，因为它们没有删除按钮）
      updatedSkills = skills.filter(skill => skill.tool_id !== id);
      message.success('工具已删除');
    }

    // 更新本地状态
    setSkills(updatedSkills);
    updateSkills(updatedSkills);
    duplicateName(updatedSkills);
  };

  // 处理工具选择完成
  const handleToolSelectComplete = (tools: SkillItem[]) => {
    if (tools?.length > 30) {
      message.info('选择的工具不能超过30个');
      return;
    }
    if (!tools || tools.length === 0) {
      setToolModalVisible(false);
      return;
    }

    const updatedSkills = tools;

    // 编辑后的覆盖新增的
    skills?.forEach(item2 => {
      const index = updatedSkills.findIndex(item1 => item1.tool_id === item2.tool_id);
      if (index !== -1) {
        updatedSkills[index] = item2; // 覆盖操作
      }
    });
    setSkills(updatedSkills);
    // 关闭模态框
    setToolModalVisible(false);
    updateSkills(updatedSkills);
    duplicateName(updatedSkills);
  };

  const duplicateName = (updatedSkills: any) => {
    const counts = updatedSkills?.reduce((acc: any, item: any) => {
      acc[item.tool_name] = (acc[item.tool_name] || 0) + 1;
      return acc;
    }, {});
    setNameCounts(counts);
  };

  useEffect(() => {
    // 筛选出重复的名称数量
    const duplicates = Object.keys(nameCounts).filter(name => nameCounts[name] > 1);
    setDuplicateCount(duplicates.length);
    duplicateCountError(duplicates.length);
  }, [nameCounts]);

  const SkillTable = (
    <div className={styles['skills-config']}>
      <Table
        dataSource={processedSkills}
        columns={skillColumns}
        pagination={false}
        className={styles['skills-table']}
        rowKey={record => record.tool_id}
        bordered
        size="small"
        expandable={{
          expandRowByClick: true,
          expandedRowRender: undefined, // 使用默认的children展开
          childrenColumnName: 'children',
          expandIcon: ({ expanded, expandable }) =>
            expandable ? (
              <RightOutlined
                className={classNames('dip-mr-12 dip-pointer dip-font-12 dip-transition-transform-30', {
                  'dip-rotate-90': expanded,
                })}
              />
            ) : null,
          onExpand: (expanded, record) => {
            // 当展开工具箱时，获取该工具箱下的工具详情
            if (expanded && record.isToolBoxNode) {
              fetchToolBoxToolDetails(record.box_id);
            }
          },
        }}
      />
    </div>
  );

  return (
    <div>
      <Button size="small" onClick={handleAddSkill}>
        添加工具
      </Button>
      <div style={{ margin: '10px 0' }}>{SkillTable}</div>
      <div>
        {duplicateCount > 0 && (
          <div style={{ color: 'red' }}>
            <strong>{duplicateCount} 个工具已重名，请修改</strong>
          </div>
        )}
      </div>
      {/* 添加工具弹窗 */}
      <AddToolModal
        agentKey={state?.key}
        visible={toolModalVisible}
        onCancel={() => setToolModalVisible(false)}
        onConfirm={handleToolSelectComplete}
        retrieverBlockOptions={[]}
        value={skills}
      />
      {editToolModal && (
        <EditToolModal
          closeModal={() => setEditToolModal(false)}
          selectedTool={editSelectedTool}
          fetchInfo={changeToolDetails}
          noEditDate
        />
      )}
    </div>
  );
};

export default SkillsSection;
