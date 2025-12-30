import classnames from 'classnames';

import type { ContainerType } from '../type';

const Container = (props: ContainerType) => {
  const { children, className, span } = props;
  return (
    <div className={classnames('containerRoot', className)} style={{ padding: span }}>
      {children}
    </div>
  );
};

export default Container;
