import React from 'react';

type ContainerIsHideType = {
  visible?: boolean;
  placeholder?: any;
  children: React.ReactNode;
};

const ContainerIsVisible = (props: Omit<ContainerIsHideType, 'visible' | 'placeholder'>) => {
  return <React.Fragment>{props.children}</React.Fragment>;
};

export default (props: ContainerIsHideType) => {
  const { visible, placeholder, ...other } = props;
  if (!visible) return placeholder || null;
  return <ContainerIsVisible {...other} />;
};
