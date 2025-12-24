import { Keys, Names, Languages } from "../core/customname";

export const defaultConfig = [
    {
        [Keys.Name]: Names.InformationBar,
        [Keys.Value]: {
            [Languages.ZHCN]: "信息栏",
            [Languages.ZHTW]: "資訊欄",
            [Languages.ENUS]: "Information Bar",
        },
    },
    {
        [Keys.Name]: Names.Favorite,
        [Keys.Value]: {
            [Languages.ZHCN]: "收藏夹",
            [Languages.ZHTW]: "收藏夾",
            [Languages.ENUS]: "Starred",
        },
    },
    {
        [Keys.Name]: Names.StoreUp,
        [Keys.Value]: {
            [Languages.ZHCN]: "收藏",
            [Languages.ZHTW]: "收藏",
            [Languages.ENUS]: "Star",
        },
    },
    {
        [Keys.Name]: Names.CancelCollection,
        [Keys.Value]: {
            [Languages.ZHCN]: "取消收藏",
            [Languages.ZHTW]: "取消收藏",
            [Languages.ENUS]: "Unstar",
        },
    },
    {
        [Keys.Name]: Names.Collection,
        [Keys.Value]: {
            [Languages.ZHCN]: "收藏",
            [Languages.ZHTW]: "收藏",
            [Languages.ENUS]: "Star",
        },
    },
    {
        [Keys.Name]: Names.DeleteCollectionTip,
        [Keys.Value]: {
            [Languages.ZHCN]: "已取消收藏",
            [Languages.ZHTW]: "已取消收藏",
            [Languages.ENUS]: "Unstarred",
        },
    },
    {
        [Keys.Name]: Names.FailureCollectionTip,
        [Keys.Value]: {
            [Languages.ZHCN]: "收藏失败",
            [Languages.ZHTW]: "收藏失敗",
            [Languages.ENUS]: "Operation failed",
        },
    },
    {
        [Keys.Name]: Names.SuccessfulCollectionTip,
        [Keys.Value]: {
            [Languages.ZHCN]: "收藏成功",
            [Languages.ZHTW]: "收藏成功",
            [Languages.ENUS]: "Starred",
        },
    },
    {
        [Keys.Name]: Names.HaveCollected,
        [Keys.Value]: {
            [Languages.ZHCN]: "已收藏",
            [Languages.ZHTW]: "已收藏",
            [Languages.ENUS]: "Starred",
        },
    },
    {
        [Keys.Name]: Names.CancelCollectionFailureTip,
        [Keys.Value]: {
            [Languages.ZHCN]: "取消收藏失败",
            [Languages.ZHTW]: "取消失敗",
            [Languages.ENUS]: "Operation failed",
        },
    },
    {
        [Keys.Name]: Names.EmptyCollectionTitle,
        [Keys.Value]: {
            [Languages.ZHCN]: "尚未将任何文档添加到收藏夹",
            [Languages.ZHTW]: "尚未將任何文件新增到收藏夾",
            [Languages.ENUS]: "No starred files yet",
        },
    },
    {
        [Keys.Name]: Names.EmptyCollectionSuggest,
        [Keys.Value]: {
            [Languages.ZHCN]: "请将{location}中您经常使用或关注的文档收藏",
            [Languages.ZHTW]: "請將{location}中您經常使用或關注的文件收藏 ",
            [Languages.ENUS]:
                "Star the files which you frequently visit from {location}",
        },
    },
    {
        [Keys.Name]: Names.EmptyCollectionTip,
        [Keys.Value]: {
            [Languages.ZHCN]: "将您经常使用的文档添加到收藏，在此处快速访问",
            [Languages.ZHTW]: "將您經常使用的文件新增到收藏，在此處快速存取",
            [Languages.ENUS]:
                "Star the file you frequently visit for quick access",
        },
    },
    {
        [Keys.Name]: Names.DocumentDynamics,
        [Keys.Value]: {
            [Languages.ZHCN]: "展示收藏夹的文档更新动态",
            [Languages.ZHTW]: "展示收藏夾的文件更新動態",
            [Languages.ENUS]: "Below are the activities of starred files",
        },
    },
    {
        [Keys.Name]: Names.DocumentSuggest,
        [Keys.Value]: {
            [Languages.ZHCN]:
                "将您经常使用或关注的文档添加到收藏夹，及时获取更新动态",
            [Languages.ZHTW]:
                "將您經常使用或關注的文件新增到收藏夹，及時獲取更新動態",
            [Languages.ENUS]: "and Star the files which you frequently visit",
        },
    },
];
