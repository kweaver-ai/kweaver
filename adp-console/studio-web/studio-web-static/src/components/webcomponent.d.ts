export interface Props extends React.ClassAttributes<any> {
    /**
     * 销毁前执行，如果返回false则不执行销毁
     */
    beforeDestroy?: () => any;
}
