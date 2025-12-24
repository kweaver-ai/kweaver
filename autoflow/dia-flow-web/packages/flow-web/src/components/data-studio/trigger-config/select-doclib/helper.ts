import { includes } from "lodash";
import { DocLibItem } from "../../../as-file-select/doclib-list";
import UserdoclibPng from '../../assets/userdoclib.png';
import DepartmentdoclibPng from '../../assets/depdoclib.png';
import CustomdoclibPng from '../../assets/customdoclib.png';
import KcdoclibPng from '../../assets/knowledgedoclib.png';

export type DocLibItemRequest = {
    /**
     * 所有（个人/部门/自定义/知识库）文档库类型
     */
    type: 'abstract';

    /**
     * 文档库信息
     */
    doc_lib: {
        /**
         * 所有个人/部门/自定义/文档库类型或者知识库
         */
        id: string; // DocLibType;
        name: string,
    };
} | {
    /**
     * 指定文档库
     */
    type: 'specific';

    /**
     * 文档库信息
     */
    doc_lib: {
        /**
         * 文档库id
         */
        id: string;

        /**
         * 文档库类型（个人/部门/自定义/知识库）
         */
        type: string; // DocLibType;

        /**
         * 文档库名称（新建和编辑接口不需要传递该字段，获取接口会获取到该字段）
         */
        name?: string;
    };
};

export enum DocLibType {
    UserLib = 'user_doc_lib',
    DepLib = 'department_doc_lib',
    CustomLib = 'custom_doc_lib',
    KcLib = 'knowledge_doc_lib'
}

export const formattedOutput = (selectdoclibs: DocLibItemRequest[]): DocLibItem[] => {
    return selectdoclibs.map((lib) => {
        const { doc_lib, type } = lib;

        if (type === 'abstract') {
            return {
                docid: doc_lib.id,
                path: doc_lib.name,
                doc_lib_type: doc_lib.id as DocLibType
            };
        }

        return {
            docid: doc_lib.id,
            path: doc_lib.name || '',
            doc_lib_type: doc_lib.type
        }
    });
};

export const formattedInput = (doclibs: DocLibItem[]): DocLibItemRequest[] => {
    return doclibs.map((lib) => {
        const { docid, path, doc_lib_type } = lib;

        if (includes([DocLibType.UserLib, DocLibType.CustomLib, DocLibType.DepLib, DocLibType.KcLib], docid)) {
            return {
                type: 'abstract',
                doc_lib: {
                    name: path,
                    id: docid
                }
            };
        } else {
            return {
                type: 'specific',
                doc_lib: {
                    id: docid,
                    name: path,
                    type: doc_lib_type
                }
            };
        }
    });
};

const getIcon = {
    [DocLibType.UserLib]: UserdoclibPng,
    [DocLibType.DepLib]: DepartmentdoclibPng,
    [DocLibType.CustomLib]: CustomdoclibPng,
    [DocLibType.KcLib]: KcdoclibPng
}

export const getDocLibIcon = (type: DocLibType) => getIcon[type] || UserdoclibPng