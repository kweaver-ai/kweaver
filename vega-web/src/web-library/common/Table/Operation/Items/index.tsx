import React, { useMemo } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

const Items = (props: any) => {
  const childrenList = useMemo(() => React.Children.toArray(props.children), [props.children]);
  const length = childrenList?.length || 0;

  return (
    <div className="g-flex-center">
      {_.map(childrenList, (child: React.ReactNode, index: number) => {
        if (!React.isValidElement(child)) return null;
        if (!child || child?.props?.visible === false) return null;
        return (
          <div key={index} className={classNames('g-flex-center', { 'g-mr-3': index !== length - 1 })}>
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default Items;
