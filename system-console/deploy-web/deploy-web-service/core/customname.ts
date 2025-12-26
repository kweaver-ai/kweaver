import { ColumnValueType } from "../common/sqltools";

export const TableName = "custom_name";

export const Keys = {
    // 共享名称
    Name: "name",
    // 配置json
    Value: "value",
};

export const Languages = {
    // 简体中文
    ZHCN: "zh-cn",
    // 繁体中文
    ZHTW: "zh-tw",
    // 美式英文
    ENUS: "en-us",
};
export const sections = {
    //查询全部
    ALL: "all",
    //查询客户端部分名词
    Anyshare: "anyshare",
    //查询移动端部分名词
    Mobile: "mobile",
};

export const languagesList = ["zh-cn", "zh-tw", "en-us"];

export const Names = {
    // 信息栏
    InformationBar: "informationBar",
    // 收藏夹
    Favorite: "favorite",
    // 收藏（动词意义,与取消收藏对应）
    StoreUp: "storeUp",
    // 取消收藏（动词）
    CancelCollection: "cancelCollection",
    // 收藏（名词，移动端）
    Collection: "collection",
    //已收藏
    HaveCollected: "haveCollected",
    // 取消收藏（提示语）
    DeleteCollectionTip: "deleteCollectionTip",
    //取消收藏失败(提示语)
    CancelCollectionFailureTip: "cancelCollectionFailureTip",
    // 收藏失败（提示语）
    FailureCollectionTip: "failureCollectionTip",
    // 收藏成功（提示语）
    SuccessfulCollectionTip: "successfulCollectionTip",
    // 空收藏提示（将您的常用文档添加到收藏，在此处快速访问）
    EmptyCollectionTip: "emptyCollectionTip",
    //尚未将任何文档添加到收藏夹
    EmptyCollectionTitle: "emptyCollectionTitle",
    //您经常使用或关注的文档收藏
    EmptyCollectionSuggest: "emptyCollectionSuggest",
    //将您经常使用或关注的文档添加到收藏夹，及时获取更新动态
    DocumentSuggest: "documentSuggest",
    //展示收藏夹的文档更新动态
    DocumentDynamics: "documentDynamics",
};

export const Anyshare = [
    Names.InformationBar,
    Names.Favorite,
    Names.DocumentDynamics,
    Names.DocumentSuggest,
    Names.EmptyCollectionSuggest,
    Names.EmptyCollectionTitle,
    Names.HaveCollected,
];

export const Mobile = [Names.Collection, , Names.EmptyCollectionTip];

/**
 * 负载
 */
export interface Payload {
    /**
     * key
     */
    name: string;
    /**
     * 属性
     */
    value: JSON;
    /**
     * 其他属性
     */
    [index: string]: any;
}

/**
 * 格式化更新列表
 * @param {*} updateList 更新列表
 * @returns [whereConditions, updateSetConditions]
 */
export const formatUpdatePayload = (updateList: ReadonlyArray<Payload>) => {
    return updateList.map((item: Payload) => {
        return [
            [
                {
                    field: Keys.Name,
                    value: item[Keys.Name] as string,
                    valueType: ColumnValueType.String,
                    operator: "=",
                },
            ],
            [
                {
                    field: Keys.Value,
                    value: item[Keys.Value] as JSON,
                    valueType: ColumnValueType.JSON,
                    operator: "=",
                },
            ],
        ];
    });
};

/**
 * 格式化 插入数据
 * @param {*} insertList 插入数据
 * @returns [fields, fieldsType, values]
 */
export const formatInsertPayload = (insertList: ReadonlyArray<Payload>) => {
    const values = insertList.map((item: Payload) => {
        return [item[Keys.Name], item[Keys.Value]];
    });
    return [
        [Keys.Name, Keys.Value],
        [ColumnValueType.String, ColumnValueType.JSON],
        values,
    ];
};
