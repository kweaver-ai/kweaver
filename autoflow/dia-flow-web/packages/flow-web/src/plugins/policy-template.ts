import { IStep } from "../components/editor/expr";

export const permTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [
                {
                    key: "tMCjhrTRAABoMwWa",
                    type: "asPerm",
                    name: "申请权限",
                    required: true,
                },
                {
                    key: "GMTlFEkaeaCpvmZn",
                    type: "datetime",
                    name: "权限有效期",
                    required: true,
                },
                {
                    key: "nIQNGTnlrPrepgDG",
                    type: "long_string",
                    name: "备注",
                },
            ],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    type: "asDoc",
                    title: "文档名称",
                    value: "{{__0.source.id}}",
                },
                {
                    type: "asPerm",
                    title: "申请权限",
                    value: "{{__0.fields.tMCjhrTRAABoMwWa}}",
                },
                {
                    type: "datetime",
                    title: "权限有效期至",
                    value: "{{__0.fields.GMTlFEkaeaCpvmZn}}",
                },
                {
                    type: "long_string",
                    title: "备注",
                    value: "{{__0.fields.nIQNGTnlrPrepgDG}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "4",
                        operator: "@anyshare/doc/perm",
                        parameters: {
                            docid: "{{__0.source.id}}",
                            type: "asPerm",
                            inherit: true,
                            perminfos: [
                                {
                                    accessor: "{{__0.accessor}}",
                                    perm: "{{__0.fields.tMCjhrTRAABoMwWa}}",
                                    endtime: "{{__0.fields.GMTlFEkaeaCpvmZn}}",
                                },
                            ],
                        },
                    },
                ],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];
export const defaultUploadTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    type: "asDoc",
                    title: "上传文档",
                    value: "{{__0.source.id}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];

export const securityUploadTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [
                {
                    key: "INvNwhoRivDvrwFA",
                    type: "asAccessorPerms",
                    name: "文档权限",
                    required: true,
                },
                {
                    key: "hEOWlLVgRbesTiWo",
                    type: "asLevel",
                    name: "文档密级",
                    required: true,
                },
                {
                    key: "uxbErKZdiYfetcSa",
                    type: "asSpaceQuota",
                    name: "配额空间",
                    required: true,
                },
                {
                    key: "JvrZcYMlsTGOIOJx",
                    type: "asAllowSuffixDoc",
                    name: "允许上传的文件格式",
                    required: true,
                },
            ],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    type: "asDoc",
                    title: "上传文档",
                    value: "{{__0.source.id}}",
                },
                {
                    type: "asAccessorPerms",
                    title: "文档权限",
                    value: "{{__0.fields.INvNwhoRivDvrwFA}}",
                },
                {
                    type: "asLevel",
                    title: "文档密级",
                    value: "{{__0.fields.hEOWlLVgRbesTiWo}}",
                },
                {
                    type: "asSpaceQuota",
                    title: "文件夹配额空间",
                    value: "{{__0.fields.uxbErKZdiYfetcSa}}",
                },
                {
                    type: "asAllowSuffixDoc",
                    title: "文件夹允许上传的格式",
                    value: "{{__0.fields.JvrZcYMlsTGOIOJx}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "12",
                        operator: "@anyshare/doc/perm",
                        parameters: {
                            docid: "{{__0.source.id}}",
                            asAccessorPerms: "{{__0.fields.INvNwhoRivDvrwFA}}",
                            type: "asAccessorPerms",
                        },
                    },
                    {
                        id: "13",
                        operator: "@anyshare/doc/setcsflevel",
                        parameters: {
                            docid: "{{__0.source.id}}",
                            csf_level: "{{__0.fields.hEOWlLVgRbesTiWo}}",
                        },
                    },
                    {
                        id: "14",
                        operator: "@control/flow/branches",
                        branches: [
                            {
                                id: "15",
                                conditions: [
                                    [
                                        {
                                            id: "19",
                                            operator: "@internal/cmp/string-eq",
                                            parameters: {
                                                a: "{{__0.source.type}}",
                                                b: "folder",
                                            },
                                        },
                                    ],
                                ],
                                steps: [
                                    {
                                        id: "16",
                                        operator: "@anyshare/doc/setspacequota",
                                        parameters: {
                                            docid: "{{__0.source.id}}",
                                            quota: "{{__0.fields.uxbErKZdiYfetcSa}}",
                                        },
                                    },
                                    {
                                        id: "20",
                                        operator:
                                            "@anyshare/doc/setallowsuffixdoc",
                                        parameters: {
                                            docid: "{{__0.source.id}}",
                                            allow_suffix_doc:
                                                "{{__0.fields.JvrZcYMlsTGOIOJx}}",
                                        },
                                    },
                                ],
                            },
                            {
                                id: "17",
                                conditions: [
                                    [
                                        {
                                            id: "21",
                                            operator:
                                                "@internal/cmp/string-neq",
                                            parameters: {
                                                a: "{{__0.source.type}}",
                                                b: "folder",
                                            },
                                        },
                                    ],
                                ],
                                steps: [],
                            },
                        ],
                    },
                ],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];

export const deleteTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    type: "asDoc",
                    title: "删除文档",
                    value: "{{__0.source.id}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];

export const renameTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [
                {
                    key: "new_name",
                    type: "string",
                    name: "文档新名称",
                },
            ],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    title: "重命名文档",
                    type: "asDoc",
                    value: "{{__0.source.id}}",
                },
                {
                    type: "string",
                    title: "文档原名称",
                    value: "{{__0.source.name}}",
                },
                {
                    type: "string",
                    title: "文档新名称",
                    value: "{{__0.fields.new_name}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];

export const moveTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [
                {
                    key: "new_parent_id",
                    type: "asDoc",
                    name: "目标位置",
                },
                {
                    key: "new_parent_path",
                    type: "string",
                    name: "目标位置路径",
                },
            ],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    title: "移动的文档",
                    type: "asDoc",
                    value: "{{__0.source.id}}",
                },
                {
                    type: "string",
                    title: "原位置",
                    value: "{{__0.source.path}}",
                },
                {
                    type: "string",
                    title: "目标位置",
                    value: "{{__0.fields.new_parent_path}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];

export const copyTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [
                {
                    key: "new_parent_id",
                    type: "asDoc",
                    name: "目标位置",
                },
                {
                    key: "new_parent_path",
                    type: "string",
                    name: "目标位置路径",
                },
            ],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    title: "复制的文档",
                    type: "asDoc",
                    value: "{{__0.source.id}}",
                },
                {
                    type: "string",
                    title: "原位置",
                    value: "{{__0.source.path}}",
                },
                {
                    type: "string",
                    title: "目标位置",
                    value: "{{__0.fields.new_parent_path}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];

export const folderPropertiesTemplate: IStep[] = [
    {
        id: "0",
        operator: "@trigger/security-policy",
        parameters: {
            fields: [
                {
                    key: "folder_csflevel",
                    type: "asLevel",
                    name: "文档密级",
                    required: true,
                },
                {
                    key: "space_quota",
                    type: "asSpaceQuota",
                    name: "配额空间",
                    required: true,
                },
                {
                    key: "allow_suffix_doc",
                    type: "asAllowSuffixDoc",
                    name: "允许以下文件类型上传",
                    required: true,
                },
            ],
        },
    },
    {
        id: "1",
        operator: "@workflow/approval",
        parameters: {
            workflow: null,
            contents: [
                {
                    title: "上传文档",
                    type: "asDoc",
                    value: "{{__0.source.id}}",
                },
                {
                    type: "asLevel",
                    title: "文档密级",
                    value: "{{__0.fields.folder_csflevel}}",
                },
                {
                    type: "asSpaceQuota",
                    title: "文件夹配额空间",
                    value: "{{__0.fields.space_quota}}",
                },
                {
                    type: "asAllowSuffixDoc",
                    title: "文件夹允许上传的格式",
                    value: "{{__0.fields.allow_suffix_doc}}",
                },
            ],
        },
    },
    {
        id: "2",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "3",
                conditions: [
                    [
                        {
                            id: "9",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "pass",
                            },
                        },
                    ],
                ],
                steps: [],
            },
            {
                id: "5",
                conditions: [
                    [
                        {
                            id: "10",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "reject",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "6",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
            },
            {
                conditions: [
                    [
                        {
                            id: "11",
                            operator: "@workflow/cmp/approval-eq",
                            parameters: {
                                a: "{{__1.result}}",
                                b: "undone",
                            },
                        },
                    ],
                ],
                steps: [
                    {
                        id: "7",
                        operator: "@internal/return",
                        parameters: {
                            result: "failed",
                        },
                    },
                ],
                id: "8",
            },
        ],
    },
];
