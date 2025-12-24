export interface TreeOptionType {
    label: string;
    value: string;
    children: TreeOptionType[];
}

export interface TagInfo {
    /**
     * 标签ID
     */
    id: string;
    /**
     * 标签名称
     */
    name: string;
    /**
     * 标签路径
     */
    path: string;
    /**
     * 标签版本
     */
    version: number;
    /**
     * 业务系统标识
     */
    business: string;
    /**
     * 业务范围
     */
    scope: string;
    /**
     * 创建时间，零时区时间戳
     */
    created_at: number;
    /**
     * 修改时间，零时区时间戳
     */
    modified_at: number;
    /**
     * 标签热度
     */
    heat: number;
    /**
     * 显示顺序
     */
    display_order: number;
    /**
     * 标签类型
     * - sensitive 敏感度标签
     */
    type?: string[];
    /**
     * 备注，不能超过255个字符
     */
    remarks?: string;
    [k: string]: unknown;
}

/**
 * 标签树节点
 */
export type Node = TagInfo & {
    /**
     * 子节点标签
     */
    child_tags?: Node[];
    [k: string]: unknown;
};

export interface TagOptionColumn {
    options: TreeOptionType[];
    active?: string;
    path: string[];
}