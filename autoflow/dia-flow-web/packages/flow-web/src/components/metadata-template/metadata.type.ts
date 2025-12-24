export enum AttrType {
    // 文本
    STRING = "string",
    // 长文本
    LONG_STRING = "long_string",
    // 数值
    INT = "int",
    // 小数
    FLOAT = "float",
    // 单选项
    ENUM = "enum",
    // 多选项
    MULTISELECT = "multiselect",
    // 日期
    DATE = "date",
    // 时长
    DURATION = "duration",
    // 人员
    PERSONNEL = "personnel",
}

// check类型
export enum StringTypeEnum {
    //电话
    PhoneNum = "phone_num_chinese_mainland",
    //身份证
    IdCard = "id_num_chinese_mainland",
    //邮箱
    Email = "email",
    //普通文本类型
    Text = "not_check",
}

// 时长类型
export enum DurationTypeEnum {
    SECONDS = "seconds",
    HOURS = "hours",
    MINUTES = "minutes",
}

export const fieldsType: string[] = [
    AttrType.DATE,
    AttrType.DURATION,
    AttrType.ENUM,
    AttrType.INT,
    AttrType.MULTISELECT,
    AttrType.STRING,
    AttrType.FLOAT,
    AttrType.LONG_STRING,
];

export interface DictItemType {
    id: string;
    text: string;
    children?: DictItemType[];
}

export interface MetaDtaOptionColumn {
    options: DictItemType[];
    active?: string;
    id: string[];
}