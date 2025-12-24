import { MicroAppContext } from '@applet/common';
import React, { useContext, useEffect, useRef } from 'react';

enum Component {
    /**
     * 组织 & 用户组 选择弹窗
     */
    OrgAndGroupPicker = 'OrgAndGroupPicker',

    /**
     * 文档库选择弹窗
     */
    LibSelector = 'LibSelector',

    /**
     * 全部文档库
     */
    DocLibsPicker = 'DocLibsPicker'
}

/**
 * 组件tab类型
 */
export enum TabType {
    /**
     * 组织
     */
    Org = 'org',

    /**
     * 用户组
     */
    Group = 'group',

    /**
     * 匿名用户
     */
    Anonymous = 'anonymous',

    /**
     * 应用账户
     */
    App = 'app',
}

/**
 * 组织树节点类型
 */
export enum NodeType {
    /**
     * 组织
     */
    ORGANIZATION,

    /**
     * 部门
     */
    DEPARTMENT,

    /**
     * 用户
     */
    USER,

    /**
     * 未分配组
     */
    UNDISTRIBUTED,
}

const ConsoleComponent: React.FC<any> = ({ component, ...props }: any) => {
    const { microWidgetProps } = useContext(MicroAppContext);
    const { components: { [component]: ConsoleComponent }, mountComponent, unmountComponent } = microWidgetProps as any;
    const componentRef = useRef<any>(null);

    useEffect(() => {
        if (ConsoleComponent && mountComponent && !!componentRef.current) {

            mountComponent({ component: ConsoleComponent, props, element: componentRef.current });
        }

        return () => {
            if (componentRef.current && unmountComponent) {
                unmountComponent(componentRef.current);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div ref={(ref) => { componentRef.current = ref ? ref : componentRef.current }}>
        </div>
    );
};

const OrgAndGroupPicker = (props: any) => {
    return <ConsoleComponent component={Component.OrgAndGroupPicker} {...props} />
}

const LibSelector = (props: any) => {
    return <ConsoleComponent component={Component.LibSelector} {...props} />
}

const DocLibsPicker = (props: any) => {
    return <ConsoleComponent component={Component.DocLibsPicker} {...props} />
}

export {
    OrgAndGroupPicker,
    LibSelector,
    DocLibsPicker
}