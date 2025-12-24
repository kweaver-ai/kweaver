import { isArray } from "lodash";

/**
 * 类型
 */
export const ColumnValueType = {
    /**
     * JSON
     */
    JSON: "json",
    /**
     * 字符串
     */
    String: "string",
    /**
     * 其他
     */
    Other: "other",
};

/**
 * 列项 类型
 */
export const ColumnType = {
    /**
     * select 列项
     */
    SelectFeilds: "selectFeilds",
    /**
     * insert 列项
     */
    InsertFeilds: "insertFeilds",
    /**
     * insert 值项
     */
    InsertValues: "InsertValues",
};

/**
 * 算数运算符
 */
type ArithmeticOperators =
    | "+" // 加
    | "-" // 减
    | "*" // 乘
    | "/"
    | "DIV"
    | "div" // 除
    | "%"
    | "MOD"
    | "mod"; // 求余

/**
 * 比较运算符
 */
type ComparisonOperators =
    | "=" // 等于
    | "!="
    | "<>" // 不等于
    | ">" // 大于
    | "<" // 小于
    | ">=" // 大于等于
    | "<=" // 小于等于
    | "<=>" // 严格比较两个null值是否相等，两个操作码均为NULL时，其所得值为1；而当一个操作码为NULL时，其所得值为0
    | "IN"
    | "in" // 在集合中
    | "LIKE"
    | "like" // 模糊匹配
    | "REGEXP"
    | "regexp"
    | "RLIKE"
    | "rlike" // 正则式匹配
    | "BETWEEN"
    | "between" //在两个值之间
    | "NOT IN"
    | "not in" // 不在集合中
    | "IS NULL"
    | "is null" //是否是null
    | "IS NOT NULL"
    | "is not null" // 是否不是null
    | "NOT BETWEEN"
    | "not between"; // 不在两个值之间

/**
 * 逻辑运算符
 */
type LogicalOperators =
    | "NOT"
    | "not"
    | "!" // 逻辑非
    | "AND"
    | "and" // 逻辑与
    | "OR"
    | "or" // 逻辑或
    | "XOR"
    | "xor"; // 逻辑异或

/**
 * 位运算符
 */
type BitwiseOperators =
    | "&" // 按位与
    | "|" // 按位或
    | "^" // 按位异或
    | "!" // 取反
    | "<<" // 左移
    | ">>"; // 右移

/**
 * 条件对象
 */
export interface Condition {
    field: string;
    value: string;
    valueType: string;
    operator:
        | ArithmeticOperators
        | ComparisonOperators
        | LogicalOperators
        | BitwiseOperators;
    logicalOperator?: LogicalOperators;
}

export class SQLTools {
    constructor() {}

    /**
     * 是否是真值
     * @param o 检查对象
     * @returns true|false
     */
    isTruly(o: any) {
        return !!o;
    }

    /**
     * 析构数据
     * @param value 数据
     * @param columnValueType 插入数据类型
     * @returns
     */
    escapeData(value: any, columnValueType: string) {
        if (columnValueType === ColumnValueType.String) {
            return `"${value}"`;
        } else if (columnValueType === ColumnValueType.JSON) {
            return `'${JSON.stringify(value)}'`;
        } else {
            return value;
        }
    }

    /**
     * 检查条件参数
     * @param field 字段
     * @param value 值
     */
    checkConditionAttr(field: string, value: any) {
        if (!this.isTruly(value)) {
            throw new Error(`clause ${field} is not get!`);
        } else if (!isArray(value)) {
            throw new Error(`clause ${field} is not array!`);
        }
    }

    /**
     * where 或者 update set等 子句 工厂函数
     * @param conditions 子句对象数组
     * @returns a = 1
     * @returns a = 1 AND b = 2
     */
    clausesFactory(conditions: ReadonlyArray<Condition>) {
        if (!isArray(conditions)) {
            throw new Error(`conditions is not an array!`);
        }
        return conditions.reduce((pre, cur) => {
            const { field, value, operator, logicalOperator, valueType } = cur;
            if (!this.isTruly(field)) {
                throw new Error(`clause field is not get!`);
            }
            if (!this.isTruly(operator)) {
                throw new Error(`clause operator is not get!`);
            }
            return (pre =
                pre +
                ` ${field} ${operator} ${this.escapeData(value, valueType)}${
                    logicalOperator ? ` ${logicalOperator} ` : ""
                }`);
        }, "");
    }

    /**
     * 列项 工厂
     * @param columns 列
     * @param type 参数类型
     * @param columnsType 列项类型
     * @returns SelectFeilds => a,b,c
     * @returns InsertFeilds => (a,b,c)
     * @returns InsertValues => (a,b,c),(d,e,f)
     */
    columnsFactory(
        columns: ReadonlyArray<string> | ReadonlyArray<ReadonlyArray<string>>,
        type: string,
        columnsType: ReadonlyArray<string>
    ) {
        this.checkConditionAttr("columns", columns);
        if (type === ColumnType.SelectFeilds) {
            return columns.join(",").toString();
        } else if (type === ColumnType.InsertFeilds) {
            return `(${columns.join(",").toString()})`;
        } else if (type === ColumnType.InsertValues) {
            return columns
                .map((column: any, i: number) => {
                    if (isArray(column)) {
                        return `(${
                            column.map &&
                            column
                                .map((val: any, j: number) => {
                                    return this.escapeData(val, columnsType[j]);
                                })
                                .join(",")
                                .toString()
                        })`;
                    } else {
                        return this.escapeData(column, columnsType[i]);
                    }
                })
                .join(",")
                .toString();
        }
    }
}
