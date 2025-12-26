import { useState } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Checkbox, Tooltip, Drawer } from 'antd';
import { CloseOutlined, QuestionCircleFilled } from '@ant-design/icons';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { adCookie } from '@/utils/handleFunction';

import './style.less';

const iconIcon = <IconFont className='ad-c-primary ad-mr-1 ad-ml-1' type='icon-mouse_add' style={{ fontSize: 12 }} />;
const ConfigTip = ({ open, onChange }: any) => {
  const [checkBoxValue, setCheckBoxValue] = useState(adCookie.get('benchmarkConfigTip') === 'false');
  const tips = [
    {
      title: intl.get('benchmark.config.tip.one.title'),
      content: [
        {
          text: intl.get('benchmark.config.tip.one.item1'),
        },
        {
          text: (
            <>
              {intl.get('benchmark.config.tip.one.item2').split('|')[0]}
              {iconIcon}
              {intl.get('benchmark.config.tip.one.item2').split('|')[1]}
            </>
          ),
        },
      ],
    },
    {
      title: intl.get('benchmark.config.tip.two.title'),
      content: [
        {
          text: intl.get('benchmark.config.tip.two.item1'),
        },
        {
          text: (
            <>
              {intl.get('benchmark.config.tip.two.item2').split('|')[0]}
              {iconIcon}
              {intl.get('benchmark.config.tip.two.item2').split('|')[1]}
            </>
          ),
        },
      ],
    },
    {
      title: intl.get('benchmark.config.tip.three.title'),
      content: [
        {
          text: (
            <>
              {intl.get('benchmark.config.tip.three.item1').split('|')[0]}
              {iconIcon}
              {intl.get('benchmark.config.tip.three.item1').split('|')[1]}
            </>
          ),
        },
        {
          text: intl.get('benchmark.config.tip.three.item2'),
        },
        {
          text: intl.get('benchmark.config.tip.three.item3'),
        },
      ],
    },
    {
      title: intl.get('benchmark.config.tip.four.title'),
      content: [
        {
          text: (
            <>
              {intl.get('benchmark.config.tip.four.item1').split('|')[0]}
              {iconIcon}
              {intl.get('benchmark.config.tip.four.item1').split('|')[1]}
            </>
          ),
        },
        {
          text: intl.get('benchmark.config.tip.four.item2'),
        },
      ],
    },
    {
      title: intl.get('benchmark.config.tip.five.title'),
      content: [
        {
          text: (
            <>
              {intl.get('benchmark.config.tip.five.item1').split('|')[0]}
              <IconFont type='icon-shangchuan' className='ad-mr-1 ad-ml-1' />
              {intl.get('benchmark.config.tip.five.item1').split('|')[1]}
            </>
          ),
        },
      ],
    },
    {
      title: intl.get('benchmark.config.tip.six.title'),
      content: [
        {
          text: intl.get('benchmark.config.tip.six.item1'),
        },
        {
          text: intl.get('benchmark.config.tip.six.item2'),
        },
      ],
    },
  ];

  const title = (
    <div className='ConfigTip-card-title ad-space-between'>
      <Format.Title>{intl.get('benchmark.config.helpGuide')}</Format.Title>
      <span className='ad-align-center'>
        <Checkbox
          checked={checkBoxValue}
          onChange={e => {
            const checked = e.target.checked;
            if (!checked) {
              adCookie.remove('benchmarkConfigTip');
            }
            setCheckBoxValue(checked);
          }}
        >
          {intl.get('benchmark.config.notTip')}
        </Checkbox>
        <CloseOutlined
          className='ad-link ad-ml-4'
          onClick={() => {
            if (checkBoxValue) {
              adCookie.set('benchmarkConfigTip', 'false');
            }
            onChange?.(false);
          }}
        />
      </span>
    </div>
  );

  return (
    <div className={classNames('ConfigTip ConfigTip-open')}>
      <div className='ConfigTip-guide'>
        <Tooltip title={intl.get('benchmark.config.helpGuide')} placement='top'>
          <Format.Button type='text' onClick={() => onChange?.(true)}>
            <QuestionCircleFilled style={{ fontSize: 24 }} className={open ? 'ad-c-primary' : 'ad-c-subtext'} />
          </Format.Button>
        </Tooltip>
      </div>

      <Drawer
        open={open}
        placement='left'
        title={title}
        closable={false}
        width={320}
        style={{ top: 100 }}
        maskClosable={false}
        mask={false}
        className='benchmark-config-drawer-tip-root'
      >
        <div className='ConfigTip-card'>
          <div className='ConfigTip-card-content'>
            {tips.map((item, index) => (
              <div
                key={index}
                className={classNames({
                  'ad-mt-6': index !== 0,
                })}
              >
                <div className='ad-c-bold'>{item.title}</div>
                <div className='ad-mt-2 ad-c-text-lower'>
                  {item.content.map((contentItem, contentItemIndex) => (
                    <div className='ad-mt-1 ad-flex' key={`${index}-${contentItemIndex}`}>
                      {item.content.length > 1 && <div>({contentItemIndex + 1})</div>}
                      <div>{contentItem.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ConfigTip;
