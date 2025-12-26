import React from 'react';
import './style.less';
import type { AnchorLinkProps, AnchorProps } from 'antd';
import { Anchor } from 'antd';
import classNames from 'classnames';

const { Link } = Anchor;

export interface AdAnchorProps extends AnchorProps {
  items: AnchorLinkProps[];
  title?: React.ReactNode;
}

const AdAnchor: React.FC<AdAnchorProps> = props => {
  const { className, title, items = [], ...restProps } = props;
  return (
    <Anchor className={classNames('ad-anchor', className)} {...restProps}>
      {title && <div className='ad-anchor-title'>{title}</div>}
      {items.map((item, i) => {
        return <Link href={item.href} title={item.title} key={item.href} />;
      })}
    </Anchor>
  );
};

export default AdAnchor;
