/*
 * @Author: LiuShangdong
 * @Date: 2023-09-13
 * @Description: 标签选择器，可以创建新标签或选择“标签管理服务”中的已有标签

    // 使用方式，示例：

    import TagsSelector, { tagsSelectorValidator } from 'PublicComponents/TagsSelector';

    <Form.Item label={formatMessage(intlMessage.tag)}>
        {getFieldDecorator('tags', {
            rules: [{ validator: tagsSelectorValidator }]
        })(<TagsSelector />)}
    </Form.Item>

    // 或自定义validator与placeholder：

    import TagsSelector from 'PublicComponents/TagsSelector';

    const myValidator = (rule, value, callback) => {
      // ...
    };

    <Form.Item label="Tag">
        {getFieldDecorator('usedTags', {
            rules: [{ validator: myValidator }]
        })(<TagsSelector placeholder={formatMessage(intlMessage.pleaseInput)} />)}
    </Form.Item>
 */

import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import getLocaleValue from '@/utils/get-locale-value/getLocaleValue';
import Request from '@/services/request';
import english from './locale/en-US';
import chinese from './locale/zh-CN';

const getIntl = getLocaleValue.bind(null, chinese, english); // 国际化

const TagsSelector: React.FC<any> = (props: any) => {
  const [tagsData, setTagsData] = useState<Array<{ tag: string; count: number }>>([]); // 从标签管理服务中get到的tags数据

  useEffect(() => {
    const getAllTags = async (): Promise<void> => {
      const tagURL = 'api/mdl-data-model/v1/object-tags/';
      const params = {
        sort: 'tag', // 根据标签名排序
        direction: 'asc', // 升序
        limit: -1, // 不分页，返回所有标签
      };
      const res: any = await Request.get(tagURL, params);

      setTagsData(res.entries);
    };

    // 如果是老模块，则不接入新标签管理服务，下拉列表为空
    if (!props.isOld) getAllTags();
  }, []);

  const handleChange = (val: Array<string>): void => {
    // val：组件接收到的用户输入的值
    // newVal：经过处理后的值，传递给外部onChange事件（props.onChange）
    // 外部validator接收到的value即为此处的newVal
    const newVal = val
      .map((i) => i.trim()) // 标签前后不能有空格
      .filter((i) => i) // 标签不能为空字符串
      .sort(); // 排序

    if (props.onChange) {
      props.onChange(newVal);
    }
  };

  return (
    <Select
      mode="tags"
      value={props.value} // 组件展示的value，为外部传入的value，即props.onChange接收到的value
      onChange={handleChange}
      placeholder={props.placeholder ?? getIntl('addTags')} // placeholder可选，若外部不传入，则为“添加标签”
      allowClear
      style={{ width: '100%' }}
    >
      {tagsData &&
        tagsData.map((item) => (
          <Select.Option value={item.tag} key={item.tag}>
            {item.tag}
          </Select.Option>
        ))}
    </Select>
  );
};

export default TagsSelector;

export const tagsSelectorValidator = (_rule: any, value: Array<string> | undefined) => {
  if (value && value.length > 5) return Promise.reject(new Error(getIntl('tagQuantityLimitInfo')));
  if (value && value.length) {
    const regex = /^[^/:?\\"<>|：?“”？！‘’,.'《》[\]%&*$^!=#{}]*$/;
    value.forEach((tag) => {
      if (tag.length > 40) return Promise.reject(new Error(getIntl('tagLengthLimitInfo')));
      if (!regex.test(tag)) return Promise.reject(new Error(getIntl('tagParticularCharacter')));
    });
  }
  return Promise.resolve();
};

export const tagQuantityLimitInfo = getIntl('tagQuantityLimitInfo');
