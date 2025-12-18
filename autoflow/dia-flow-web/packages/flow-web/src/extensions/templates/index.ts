import { IStep } from "../../components/editor/expr";

/**
 * 协同办公
 */

/**文档操作（删除）限制 */
export const deleteApproval = {
    templateId: "deleteApproval",
    title: "template.deleteApproval",
    description: "description.deleteApproval",
    dependency: ["@workflow/approval"],
    actions: ["@trigger/form", "@workflow/approval", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/form",
            parameters: {
                fields: [
                    {
                        key: "iDWeivqUNvdAkPMw",
                        name: "申请删除的文件",
                        required: true,
                        type: "asFile",
                    },
                    {
                        key: "uWrWBUpkcBoMWHdg",
                        name: "备注",
                        type: "string",
                    },
                ],
            },
        },
        {
            id: "1",
            title: "",
            operator: "@workflow/approval",
            parameters: {
                contents: [
                    {
                        title: "申请删除的文件",
                        type: "asFile",
                        value: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                    },
                    {
                        title: "备注",
                        type: "string",
                        value: "{{__0.fields.uWrWBUpkcBoMWHdg}}",
                    },
                ],
                title: "删除文件审核",
                workflow: null,
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "7",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "pass",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            title: "",
                            operator: "@anyshare/file/remove",
                            parameters: {
                                docid: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/**文档操作（重命名）限制 */
export const renameApproval = {
    templateId: "renameApproval",
    title: "template.renameApproval",
    description: "description.renameApproval",
    dependency: ["@workflow/approval"],
    actions: ["@trigger/form", "@workflow/approval", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/form",
            parameters: {
                fields: [
                    {
                        key: "iDWeivqUNvdAkPMw",
                        name: "申请重命名的文件",
                        required: true,
                        type: "asFile",
                    },
                    {
                        key: "aKvVmYeBWepGmXdJ",
                        name: "新文件名",
                        required: true,
                        type: "string",
                    },
                    {
                        key: "xUJLYrfeHOiZUbJC",
                        name: "备注",
                        type: "string",
                    },
                ],
            },
        },
        {
            id: "1",
            title: "",
            operator: "@workflow/approval",
            parameters: {
                contents: [
                    {
                        title: "申请重命名的文件",
                        type: "asFile",
                        value: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                    },
                    {
                        title: "新文件名",
                        type: "string",
                        value: "{{__0.fields.aKvVmYeBWepGmXdJ}}",
                    },
                    {
                        title: "备注",
                        type: "string",
                        value: "{{__0.fields.xUJLYrfeHOiZUbJC}}",
                    },
                ],
                title: "重命名文件审核",
                workflow: null,
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "10",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "pass",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            title: "",
                            operator: "@anyshare/file/rename",
                            parameters: {
                                docid: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                                name: "{{__0.fields.aKvVmYeBWepGmXdJ}}",
                                ondup: 2,
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/**文档权限申请 */
export const permission = {
    templateId: "permission",
    title: "template.permission",
    description: "description.permission",
    dependency: ["@workflow/approval"],
    actions: ["@trigger/form", "@workflow/approval", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            operator: "@trigger/form",
            parameters: {
                fields: [
                    {
                        key: "TlUytUQNGmYlzykC",
                        type: "radio",
                        name: "需申请权限的文档类型",
                        data: [
                            {
                                value: "文件",
                                related: [
                                    "iDWeivqUNvdAkPMw",
                                    "uWrWBUpkcBoMWHdg",
                                    "GoIlZuodcWqMWBDP",
                                    "cbczFElxzJDzymYc",
                                ],
                            },
                            {
                                value: "文件夹",
                                related: [
                                    "yURhDzFCdwVEDlyT",
                                    "uWrWBUpkcBoMWHdg",
                                    "GoIlZuodcWqMWBDP",
                                    "cbczFElxzJDzymYc",
                                ],
                            },
                        ],
                        required: true,
                    },
                    {
                        key: "iDWeivqUNvdAkPMw",
                        type: "asFile",
                        name: "选择文件",
                        required: true,
                    },
                    {
                        key: "yURhDzFCdwVEDlyT",
                        type: "asFolder",
                        name: "选择文件夹",
                        required: true,
                    },
                    {
                        key: "uWrWBUpkcBoMWHdg",
                        type: "asPerm",
                        name: "申请权限",
                        required: true,
                    },
                    {
                        key: "GoIlZuodcWqMWBDP",
                        name: "权限有效期至",
                        required: true,
                        type: "datetime",
                    },
                    {
                        key: "cbczFElxzJDzymYc",
                        name: "备注",
                        type: "string",
                    },
                ],
            },
        },
        {
            id: "1",
            operator: "@workflow/approval",
            parameters: {
                title: "权限申请审核",
                workflow: null,
                contents: [
                    {
                        title: "申请权限的文件",
                        type: "asFile",
                        value: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                    },
                    {
                        title: "申请权限的文件夹",
                        type: "asFolder",
                        value: "{{__0.fields.yURhDzFCdwVEDlyT}}",
                    },
                    {
                        title: "申请的权限",
                        type: "asPerm",
                        value: "{{__0.fields.uWrWBUpkcBoMWHdg}}",
                    },
                    {
                        title: "权限有效期",
                        type: "datetime",
                        value: "{{__0.fields.GoIlZuodcWqMWBDP}}",
                    },
                    {
                        title: "备注",
                        type: "string",
                        value: "{{__0.fields.cbczFElxzJDzymYc}}",
                    },
                ],
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "7",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "pass",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "12",
                            operator: "@control/flow/branches",
                            branches: [
                                {
                                    id: "13",
                                    conditions: [
                                        [
                                            {
                                                id: "17",
                                                operator:
                                                    "@internal/cmp/string-eq",
                                                parameters: {
                                                    a: "{{__0.fields.TlUytUQNGmYlzykC}}",
                                                    b: "文件",
                                                },
                                            },
                                        ],
                                    ],
                                    steps: [
                                        {
                                            id: "14",
                                            operator: "@anyshare/file/perm",
                                            parameters: {
                                                docid: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                                                config_inherit: false,
                                                inherit: true,
                                                perminfos: [
                                                    {
                                                        accessor:
                                                            "{{__0.accessor}}",
                                                        perm: "{{__0.fields.uWrWBUpkcBoMWHdg}}",
                                                        endtime:
                                                            "{{__0.fields.GoIlZuodcWqMWBDP}}",
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                                {
                                    id: "15",
                                    conditions: [
                                        [
                                            {
                                                id: "18",
                                                operator:
                                                    "@internal/cmp/string-eq",
                                                parameters: {
                                                    a: "{{__0.fields.TlUytUQNGmYlzykC}}",
                                                    b: "文件夹",
                                                },
                                            },
                                        ],
                                    ],
                                    steps: [
                                        {
                                            id: "16",
                                            operator: "@anyshare/folder/perm",
                                            parameters: {
                                                docid: "{{__0.fields.yURhDzFCdwVEDlyT}}",
                                                config_inherit: false,
                                                inherit: true,
                                                perminfos: [
                                                    {
                                                        accessor:
                                                            "{{__0.accessor}}",
                                                        perm: "{{__0.fields.uWrWBUpkcBoMWHdg}}",
                                                        endtime:
                                                            "{{__0.fields.GoIlZuodcWqMWBDP}}",
                                                    },
                                                ],
                                            },
                                        },
                                    ],
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
                                id: "8",
                                operator: "@workflow/cmp/approval-eq",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "reject",
                                },
                            },
                        ],
                    ],
                    steps: [],
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
                    steps: [],
                    id: "10",
                },
            ],
        },
    ],
};

/**合同类文件流转管理 */
export const contractRelay = {
    templateId: "contractRelay",
    title: "template.contractRelay",
    description: "description.contractRelay",
    dependency: ["@workflow/approval"],
    actions: ["@trigger/form", "@workflow/approval", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/form",
            parameters: {
                fields: [
                    {
                        key: "iDWeivqUNvdAkPMw",
                        name: "合同文件",
                        required: true,
                        type: "asFile",
                    },
                    {
                        key: "uWrWBUpkcBoMWHdg",
                        name: "备注",
                        type: "string",
                    },
                ],
            },
        },
        {
            id: "1",
            operator: "@workflow/approval",
            parameters: {
                title: "合同类文件审核",
                workflow: null,
                contents: [
                    {
                        title: "合同文件",
                        type: "asFile",
                        value: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                    },
                    {
                        title: "备注",
                        type: "string",
                        value: "{{__0.fields.uWrWBUpkcBoMWHdg}}",
                    },
                ],
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "7",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "pass",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            title: "",
                            operator: "@anyshare/file/copy",
                            parameters: {
                                destparent: null,
                                docid: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                                ondup: 3,
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/**配额空间扩容申请 */
export const expansion = {
    templateId: "expansion",
    title: "template.expansion",
    description: "description.expansion",
    dependency: ["@workflow/approval", "@anyshare/doclib/quota-scale"],
    actions: ["@trigger/form", "@workflow/approval", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/form",
            parameters: {
                fields: [
                    {
                        key: "iDWeivqUNvdAkPMw",
                        name: "扩容大小（GB）",
                        required: true,
                        type: "number",
                        description: {
                            "type": "text",
                            "text": "每次扩容大小不超过20GB"
                        }
                    },
                    {
                        key: "uWrWBUpkcBoMWHdg",
                        name: "备注",
                        type: "string",
                    },
                ],
            },
        },
        {
            id: "1",
            operator: "@workflow/approval",
            parameters: {
                title: "配额空间申请",
                workflow: null,
                contents: [
                    {
                        title: "扩容大小",
                        type: "number",
                        value: "{{__0.fields.iDWeivqUNvdAkPMw}}",
                    },
                    {
                        title: "备注",
                        type: "string",
                        value: "{{__0.fields.uWrWBUpkcBoMWHdg}}",
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
                            operator: "@anyshare/doclib/quota-scale",
                            parameters: {
                                user: "{{__0.accessor}}",
                                scale_size: "{{__0.fields.iDWeivqUNvdAkPMw}}",
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
                    steps: [],
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
                    steps: [],
                    id: "8",
                },
            ],
        },
    ],
};

/**外发公文流转管理 */
export const docRelay = {
    templateId: "docRelay",
    title: "template.docRelay",
    description: "description.docRelay",
    dependency: ["@workflow/approval"],
    actions: ["@trigger/form", "@workflow/approval", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/form",
            parameters: {
                fields: [
                    {
                        key: "hLAvqBerhyYYGkvo",
                        name: "项目编号",
                        required: true,
                        type: "number",
                    },
                    {
                        key: "QeflTAxcblUMbfYE",
                        name: "项目名称",
                        required: true,
                        type: "string",
                    },
                    {
                        key: "jrkAaLKIJAbqoZVr",
                        name: "公文标题",
                        required: true,
                        type: "string",
                    },
                    {
                        key: "ALHFmCxNQNqINwuf",
                        name: "收文单位",
                        required: true,
                        type: "string",
                    },
                    {
                        key: "ONIWaqSXHbVgiRmH",
                        name: "公文代号",
                        required: true,
                        type: "number",
                    },
                    {
                        key: "FDMohMiGEVTDTWAC",
                        name: "主送单位",
                        required: true,
                        type: "string",
                    },
                    {
                        key: "LFRMHhOxkutAbkZb",
                        name: "抄送单位",
                        required: true,
                        type: "string",
                    },
                    {
                        key: "NqPtDjcsFrSCXhiN",
                        name: "即发日期",
                        required: true,
                        type: "datetime",
                    },
                    {
                        key: "YZQplxhopZWhbnRU",
                        name: "附件",
                        required: true,
                        type: "asFile",
                    },
                ],
            },
        },
        {
            id: "1",
            title: "",
            operator: "@workflow/approval",
            parameters: {
                contents: [
                    {
                        title: "项目名称",
                        type: "string",
                        value: "{{__0.fields.QeflTAxcblUMbfYE}}",
                    },
                    {
                        title: "公文标题",
                        type: "string",
                        value: "{{__0.fields.jrkAaLKIJAbqoZVr}}",
                    },
                    {
                        title: "收文单位",
                        type: "string",
                        value: "{{__0.fields.ALHFmCxNQNqINwuf}}",
                    },
                    {
                        title: "主送单位",
                        type: "string",
                        value: "{{__0.fields.FDMohMiGEVTDTWAC}}",
                    },
                    {
                        title: "抄送单位",
                        type: "string",
                        value: "{{__0.fields.LFRMHhOxkutAbkZb}}",
                    },
                    {
                        title: "即发日期",
                        type: "datetime",
                        value: "{{__0.fields.NqPtDjcsFrSCXhiN}}",
                    },
                    {
                        title: "附件",
                        type: "asFile",
                        value: "{{__0.fields.YZQplxhopZWhbnRU}}",
                    },
                ],
                title: "公文流转审核",
                workflow: null,
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "7",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "pass",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            title: "",
                            operator: "@anyshare/file/addtag",
                            parameters: {
                                docid: "{{__0.fields.YZQplxhopZWhbnRU}}",
                                tags: ["已审核"],
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/**产品知识发布流程 */
export const knowledgeFlow = {
    templateId: "knowledgeFlow",
    title: "template.knowledgeFlow",
    description: "description.knowledgeFlow",
    dependency: ["@workflow/approval"],
    actions: [
        "@trigger/selected-file",
        "@workflow/approval",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/selected-file",
            parameters: {
                docid: null,
                fields: [
                    {
                        key: "NtZTWcugBJkFDykz",
                        name: "审核通过后复制到目标文件夹",
                        required: true,
                        type: "asFolder",
                    },
                    {
                        key: "FlLJoYszqPfEYsBH",
                        name: "标签",
                        required: true,
                        type: "asTags",
                    },
                    {
                        key: "EjbagLJORQLMqSIX",
                        name: "编目",
                        required: true,
                        type: "asMetadata",
                    },
                    {
                        data: [
                            "将同名文件移动到第五项所选文件夹进行归档",
                            "将同名文件删除",
                        ],
                        key: "VnzFtckPCqndIhmc",
                        name: "若目标文件夹下已有同名文件，您想如何处理同名文件",
                        required: true,
                        type: "radio",
                    },
                    {
                        key: "eQKBZadXMKgfZKeu",
                        name: "归档文件夹，若无需归档可不填此项",
                        required: false,
                        type: "asFolder",
                    },
                ],
                inherit: true,
            },
        },
        {
            id: "1",
            title: "",
            operator: "@workflow/approval",
            parameters: {
                contents: [
                    {
                        title: "待发布文件",
                        type: "asFile",
                        value: "{{__0.source.id}}",
                    },
                    {
                        title: "审核通过后复制到目标文件夹",
                        type: "asFolder",
                        value: "{{__0.fields.NtZTWcugBJkFDykz}}",
                    },
                    {
                        title: "标签",
                        type: "asTags",
                        value: "{{__0.fields.FlLJoYszqPfEYsBH}}",
                    },
                    {
                        title: "编目",
                        type: "asMetadata",
                        value: "{{__0.fields.EjbagLJORQLMqSIX}}",
                    },
                    {
                        title: "目标文件夹下的同名文件处理",
                        type: "string",
                        value: "{{__0.fields.VnzFtckPCqndIhmc}}",
                    },
                    {
                        title: "归档文件夹",
                        type: "asFolder",
                        value: "{{__0.fields.eQKBZadXMKgfZKeu}}",
                    },
                ],
                title: "产品知识发布流程审核",
                workflow: null,
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "7",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "pass",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "12",
                            title: "",
                            operator: "@control/flow/branches",
                            branches: [
                                {
                                    id: "13",
                                    conditions: [
                                        [
                                            {
                                                id: "17",
                                                parameters: {
                                                    a: "{{__0.fields.VnzFtckPCqndIhmc}}",
                                                    b: "将同名文件移动到第五项所选文件夹进行归档",
                                                },
                                                operator:
                                                    "@internal/cmp/string-eq",
                                            },
                                        ],
                                    ],
                                    steps: [
                                        {
                                            id: "14",
                                            title: "",
                                            operator:
                                                "@anyshare/file/get-file-by-name",
                                            parameters: {
                                                docid: "{{__0.fields.NtZTWcugBJkFDykz}}",
                                                name: "{{__0.source.name}}",
                                            },
                                        },
                                        {
                                            id: "18",
                                            title: "",
                                            operator: "@control/flow/branches",
                                            branches: [
                                                {
                                                    id: "19",
                                                    conditions: [
                                                        [
                                                            {
                                                                id: "23",
                                                                parameters: {
                                                                    a: "{{__14.name}}",
                                                                },
                                                                operator:
                                                                    "@internal/cmp/string-not-empty",
                                                            },
                                                        ],
                                                    ],
                                                    steps: [
                                                        {
                                                            id: "20",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/move",
                                                            parameters: {
                                                                destparent:
                                                                    "{{__0.fields.eQKBZadXMKgfZKeu}}",
                                                                docid: "{{__14.docid}}",
                                                                ondup: 3,
                                                            },
                                                        },
                                                        {
                                                            id: "29",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/copy",
                                                            parameters: {
                                                                destparent:
                                                                    "{{__0.fields.NtZTWcugBJkFDykz}}",
                                                                docid: "{{__0.source.id}}",
                                                                ondup: 3,
                                                            },
                                                        },
                                                        {
                                                            id: "30",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/addtag",
                                                            parameters: {
                                                                docid: "{{__29.new_docid}}",
                                                                tags: "{{__0.fields.FlLJoYszqPfEYsBH}}",
                                                            },
                                                        },
                                                        {
                                                            id: "31",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/settemplate",
                                                            parameters: {
                                                                docid: "{{__29.new_docid}}",
                                                                templates:
                                                                    "{{__0.fields.EjbagLJORQLMqSIX}}",
                                                            },
                                                        },
                                                        {
                                                            id: "32",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/relevance",
                                                            parameters: {
                                                                docid: "{{__29.new_docid}}",
                                                                relevance:
                                                                    "{{__20.docid}}",
                                                            },
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: "21",
                                                    conditions: [
                                                        [
                                                            {
                                                                id: "28",
                                                                parameters: {
                                                                    a: "{{__14.name}}",
                                                                },
                                                                operator:
                                                                    "@internal/cmp/string-empty",
                                                            },
                                                        ],
                                                    ],
                                                    steps: [
                                                        {
                                                            id: "33",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/copy",
                                                            parameters: {
                                                                destparent:
                                                                    "{{__0.fields.NtZTWcugBJkFDykz}}",
                                                                docid: "{{__0.source.id}}",
                                                                ondup: 3,
                                                            },
                                                        },
                                                        {
                                                            id: "34",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/addtag",
                                                            parameters: {
                                                                docid: "{{__33.new_docid}}",
                                                                tags: "{{__0.fields.FlLJoYszqPfEYsBH}}",
                                                            },
                                                        },
                                                        {
                                                            id: "35",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/settemplate",
                                                            parameters: {
                                                                docid: "{{__33.new_docid}}",
                                                                templates:
                                                                    "{{__0.fields.EjbagLJORQLMqSIX}}",
                                                            },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    id: "26",
                                    conditions: [
                                        [
                                            {
                                                id: "27",
                                                parameters: {
                                                    a: "{{__0.fields.VnzFtckPCqndIhmc}}",
                                                    b: "将同名文件删除",
                                                },
                                                operator:
                                                    "@internal/cmp/string-eq",
                                            },
                                        ],
                                    ],
                                    steps: [
                                        {
                                            id: "25",
                                            title: "",
                                            operator:
                                                "@anyshare/file/get-file-by-name",
                                            parameters: {
                                                docid: "{{__0.fields.NtZTWcugBJkFDykz}}",
                                                name: "{{__0.source.name}}",
                                            },
                                        },
                                        {
                                            id: "39",
                                            title: "",
                                            operator: "@control/flow/branches",
                                            branches: [
                                                {
                                                    id: "40",
                                                    conditions: [
                                                        [
                                                            {
                                                                id: "45",
                                                                parameters: {
                                                                    a: "{{__25.name}}",
                                                                },
                                                                operator:
                                                                    "@internal/cmp/string-not-empty",
                                                            },
                                                        ],
                                                    ],
                                                    steps: [
                                                        {
                                                            id: "41",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/remove",
                                                            parameters: {
                                                                docid: "{{__25.docid}}",
                                                            },
                                                        },
                                                        {
                                                            id: "47",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/copy",
                                                            parameters: {
                                                                destparent:
                                                                    "{{__0.fields.NtZTWcugBJkFDykz}}",
                                                                docid: "{{__0.source.id}}",
                                                                ondup: 3,
                                                            },
                                                        },
                                                        {
                                                            id: "48",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/addtag",
                                                            parameters: {
                                                                docid: "{{__47.new_docid}}",
                                                                tags: "{{__0.fields.FlLJoYszqPfEYsBH}}",
                                                            },
                                                        },
                                                        {
                                                            id: "49",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/settemplate",
                                                            parameters: {
                                                                docid: "{{__47.new_docid}}",
                                                                templates:
                                                                    "{{__0.fields.EjbagLJORQLMqSIX}}",
                                                            },
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: "42",
                                                    conditions: [
                                                        [
                                                            {
                                                                id: "46",
                                                                parameters: {
                                                                    a: "{{__25.name}}",
                                                                },
                                                                operator:
                                                                    "@internal/cmp/string-empty",
                                                            },
                                                        ],
                                                    ],
                                                    steps: [
                                                        {
                                                            id: "43",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/copy",
                                                            parameters: {
                                                                destparent:
                                                                    "{{__0.fields.NtZTWcugBJkFDykz}}",
                                                                docid: "{{__0.source.id}}",
                                                                ondup: 3,
                                                            },
                                                        },
                                                        {
                                                            id: "50",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/addtag",
                                                            parameters: {
                                                                docid: "{{__43.new_docid}}",
                                                                tags: "{{__0.fields.FlLJoYszqPfEYsBH}}",
                                                            },
                                                        },
                                                        {
                                                            id: "51",
                                                            title: "",
                                                            operator:
                                                                "@anyshare/file/settemplate",
                                                            parameters: {
                                                                docid: "{{__43.new_docid}}",
                                                                templates:
                                                                    "{{__0.fields.EjbagLJORQLMqSIX}}",
                                                            },
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
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
                                id: "8",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "reject",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [],
                },
                {
                    id: "10",
                    conditions: [
                        [
                            {
                                id: "11",
                                parameters: {
                                    a: "{{__1.result}}",
                                    b: "undone",
                                },
                                operator: "@workflow/cmp/approval-eq",
                            },
                        ],
                    ],
                    steps: [],
                },
            ],
        },
    ],
};

/**
 * 内容提取
 */

/**自动添加文档分类以便于内容管理*/
export const tagging = {
    templateId: "tagging",
    title: "template.tagging",
    description: "description.tagging",
    actions: [
        "@anyshare-trigger/upload-file",
        "@anyshare/file/getpath",
        "@internal/text/split",
        "@anyshare/file/addtag",
    ],
    steps: [
        {
            id: "0",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docid: null,
                inherit: true,
            },
        },
        {
            id: "1",
            operator: "@anyshare/file/getpath",
            parameters: {
                order: "asc",
                docid: "{{__0.id}}",
                depth: -1,
            },
        },
        {
            id: "2",
            operator: "@internal/text/split",
            parameters: {
                custom: "/",
                separator: "custom",
                text: "{{__1.path}}",
            },
        },
        {
            id: "3",
            operator: "@anyshare/file/addtag",
            parameters: {
                docid: "{{__0.id}}",
                tags: "{{__2.slices}}",
            },
        },
    ],
};

/** 内容敏感的密级管控*/
export const setcsfLevel = {
    templateId: "setcsfLevel",
    title: "template.setcsfLevel",
    description: "description.setcsfLevel",
    actions: [
        "@anyshare-trigger/upload-file",
        "@anyshare/file/matchcontent",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docid: null,
                inherit: true,
            },
        },
        {
            id: "1",
            operator: "@anyshare/file/matchcontent",
            parameters: {
                docid: "{{__0.id}}",
                matchtype: "KEYWORD",
                keyword: "合同",
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
                                id: "7",
                                operator: "@internal/cmp/string-contains",
                                parameters: {
                                    a: "{{__0.name}}",
                                    b: "合同",
                                },
                            },
                            {
                                id: "8",
                                operator: "@internal/cmp/number-gt",
                                parameters: {
                                    a: "{{__1.match_nums}}",
                                    b: 3,
                                },
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            operator: "@anyshare/file/setcsflevel",
                            parameters: {
                                docid: "{{__0.id}}",
                                csf_level: null,
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/** 基于文件分类自动添加编目属性，便于内容理解和发现*/
export const matchTextForTemplate = {
    templateId: "matchTextForTemplate",
    title: "template.matchTextForTemplate",
    description: "description.matchTextForTemplate",
    actions: [
        "@anyshare-trigger/create-folder",
        "@internal/text/match",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@anyshare-trigger/create-folder",
            parameters: {
                docids: null,
            },
        },
        {
            id: "1",
            title: "",
            operator: "@internal/text/match",
            parameters: {
                matchtype: "NUMBER",
                text: "{{__0.name}}",
            },
        },
        {
            id: "2",
            title: "",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "3",
                    conditions: [
                        [
                            {
                                id: "6",
                                parameters: {
                                    a: "{{__1.matched}}",
                                },
                                operator: "@internal/cmp/string-not-empty",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            title: "",
                            operator: "@anyshare/folder/settemplate",
                            parameters: {
                                docid: "{{__0.id}}",
                                templates: undefined,
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [
                        [
                            {
                                id: "7",
                                operator: "@internal/cmp/string-empty",
                                parameters: {
                                    a: "{{__1.matched}}",
                                },
                            },
                        ],
                    ],
                    steps: [],
                },
            ],
        },
    ],
};

/** 自动识别文件页数后，填入编目模板中的相应字段*/
export const getPageForTemplate = {
    templateId: "getPageForTemplate",
    title: "template.getPageForTemplate",
    description: "description.getPageForTemplate",
    actions: [
        "@trigger/manual",
        "@anyshare/file/getpage",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            operator: "@trigger/manual",
            dataSource: {
                id: "2",
                operator: "@anyshare-data/list-files",
                parameters: {
                    docid: null,
                },
            },
        },
        {
            id: "1",
            operator: "@anyshare/file/getpage",
            parameters: {
                docid: "{{__2.id}}",
            },
        },
        {
            id: "3",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "4",
                    conditions: [
                        [
                            {
                                id: "8",
                                operator: "@internal/cmp/number-neq",
                                parameters: {
                                    a: "{{__1.page_nums}}",
                                    b: 0,
                                },
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "5",
                            operator: "@anyshare/file/settemplate",
                            parameters: {
                                docid: "{{__2.id}}",
                                templates: undefined,
                            },
                        },
                    ],
                },
                {
                    id: "6",
                    conditions: [
                        [
                            {
                                id: "9",
                                operator: "@internal/cmp/number-eq",
                                parameters: {
                                    a: "{{__1.page_nums}}",
                                    b: 0,
                                },
                            },
                        ],
                    ],
                    steps: [],
                },
            ],
        },
    ],
};

/**特定文件类型的内容管理 */
export const recognizeResume = {
    templateId: "recognizeResume",
    title: "template.recognizeResume",
    description: "description.recognizeResume",
    dependency: ["@anyshare/ocr/general", "@internal/tool/py3"],
    actions: [
        "@anyshare-trigger/upload-file",
        "@anyshare/ocr/general",
        "@internal/tool/py3",
        "@anyshare/file/settemplate",
    ],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docids: [null],
                inherit: true,
            },
        },
        {
            id: "1",
            title: "",
            operator: "@anyshare/ocr/general",
            parameters: {
                docid: "{{__0.id}}",
            },
        },
        {
            id: "2",
            title: "",
            operator: "@internal/tool/py3",
            parameters: {
                code: "def main():\n    return ",
                input_params: [],
                output_params: [],
            },
        },
        {
            id: "3",
            title: "",
            operator: "@anyshare/file/settemplate",
            parameters: {
                docid: "{{__0.id}}",
                templates: null,
            },
        },
    ],
};

/**识别文件内容后，基于文件内容新建文件夹层级并移动文件 */
export const recognizeMove = {
    templateId: "recognizeMove",
    title: "template.recognizeMove",
    description: "description.recognizeMove",
    dependency: ["@anyshare/ocr/general", "@internal/tool/py3"],
    actions: [
        "@anyshare-trigger/upload-file",
        "@anyshare/ocr/general",
        "@internal/tool/py3",
        "@anyshare/folder/create",
        "@anyshare/file/move",
    ],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docids: null,
                inherit: false,
            },
        },
        {
            id: "1",
            title: "",
            operator: "@anyshare/ocr/general",
            parameters: {
                docid: "{{__0.id}}",
            },
        },
        {
            id: "2",
            title: "",
            operator: "@internal/tool/py3",
            parameters: {
                code: "def main():\n    return ",
                input_params: [],
                output_params: [],
            },
        },
        {
            id: "3",
            title: "",
            operator: "@anyshare/folder/create",
            parameters: {
                docid: null,
                name: "识别结果",
                ondup: 3,
            },
        },
        {
            id: "4",
            title: "",
            operator: "@anyshare/file/move",
            parameters: {
                destparent: "{{__3.docid}}",
                docid: "{{__0.id}}",
                ondup: 3,
            },
        },
    ],
};

/**使用大模型提取文档关键内容自动生成发布文件 */
export const docSummary = {
    templateId: "docSummary",
    title: "template.docSummary",
    description: "description.docSummary",
    dependency: ["@cognitive-assistant/doc-summarize", "@workflow/approval"],
    actions: [
        "@anyshare-trigger/upload-file",
        "@cognitive-assistant/doc-summarize",
        "@workflow/approval",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docids: null,
                inherit: false,
            },
        },
        {
            id: "1",
            operator: "@cognitive-assistant/doc-summarize",
            parameters: {
                docid: "{{__0.id}}",
            },
        },
        {
            id: "2",
            operator: "@workflow/approval",
            parameters: {
                title: "人工校验大模型生成内容",
                workflow: null,
                contents: [
                    {
                        type: "asFile",
                        title: "原文件",
                        value: "{{__0.id}}",
                    },
                    {
                        type: "string",
                        title: "大模型生成内容",
                        value: "{{__1.result}}",
                        allowModifyByAuditor: true,
                    },
                ],
            },
        },
        {
            id: "3",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "4",
                    conditions: [
                        [
                            {
                                id: "8",
                                operator: "@workflow/cmp/approval-eq",
                                parameters: {
                                    a: "{{__2.result}}",
                                    b: "pass",
                                },
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "5",
                            operator: "@anyshare/file/create",
                            parameters: {
                                type: "docx",
                                name: "",
                                docid: null,
                                ondup: 2,
                            },
                        },
                        {
                            id: "9",
                            operator: "@anyshare/file/editdocx",
                            parameters: {
                                docid: "{{__5.docid}}",
                                insert_type: "append",
                                content: "{{__2.contents_1.value}}",
                            },
                        },
                        {
                            id: "10",
                            operator: "@anyshare/file/relevance",
                            parameters: {
                                docid: "{{__9.docid}}",
                                relevance: "{{__0.id}}",
                            },
                        },
                    ],
                },
                {
                    id: "6",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};
/**使用大模型总结会议音频文件后提取会议纪要并生成文件 */
export const meetingSummary = {
    templateId: "meetingSummary",
    title: "template.meetingSummary",
    description: "description.meetingSummary",
    dependency: [
        "@cognitive-assistant/doc-summarize",
        "@audio/transfer",
        "@workflow/approval",
    ],
    actions: [
        "@anyshare-trigger/upload-file",
        "@audio/transfer",
        "@anyshare/file/create",
        "@anyshare/file/editdocx",
        "@cognitive-assistant/meet-summarize",
        "@workflow/approval",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docids: null,
                inherit: false,
            },
        },
        {
            id: "10",
            operator: "@audio/transfer",
            parameters: {
                docid: "{{__0.id}}",
            },
        },
        {
            id: "11",
            operator: "@anyshare/file/create",
            parameters: {
                type: "docx",
                name: null,
                docid: null,
                ondup: 2,
            },
        },
        {
            id: "12",
            operator: "@anyshare/file/editdocx",
            parameters: {
                docid: "{{__11.docid}}",
                insert_type: "append",
                content: "{{__10.result}}",
            },
        },
        {
            id: "1",
            operator: "@cognitive-assistant/meet-summarize",
            parameters: {
                docid: "{{__12.docid}}",
            },
        },
        {
            id: "2",
            operator: "@workflow/approval",
            parameters: {
                title: "人工校验大模型生成内容",
                workflow: null,
                contents: [
                    {
                        type: "asFile",
                        title: "原文件",
                        value: "{{__0.id}}",
                    },
                    {
                        type: "string",
                        title: "大模型生成内容",
                        value: "{{__1.result}}",
                        allowModifyByAuditor: true,
                    },
                ],
            },
        },
        {
            id: "3",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "4",
                    conditions: [
                        [
                            {
                                id: "8",
                                operator: "@workflow/cmp/approval-eq",
                                parameters: {
                                    a: "{{__2.result}}",
                                    b: "pass",
                                },
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "9",
                            operator: "@anyshare/file/editdocx",
                            parameters: {
                                docid: "{{__12.docid}}",
                                insert_type: "cover",
                                content: "{{__2.contents_1.value}}",
                            },
                        },
                        {
                            id: "13",
                            operator: "@anyshare/file/relevance",
                            parameters: {
                                docid: "{{__9.docid}}",
                                relevance: "{{__0.id}}",
                            },
                        },
                    ],
                },
                {
                    id: "6",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/**自动识别发票信息并同步至表格 */
export const identifyInvoice = {
    templateId: "identifyInvoice",
    title: "template.identifyInvoice",
    description: "description.identifyInvoice",
    dependency: ["@anyshare/ocr/general"],
    actions: [
        "@anyshare-trigger/upload-file",
        "@anyshare/ocr/eleinvoice",
        "@anyshare/file/editexcel",
    ],
    steps: [
        {
            id: "0",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docids: null,
                inherit: true,
            },
        },
        {
            id: "1",
            operator: "@anyshare/ocr/eleinvoice",
            parameters: {
                docid: "{{__0.id}}",
            },
        },
        {
            id: "2",
            operator: "@anyshare/file/editexcel",
            parameters: {
                docid: null,
                new_type: "new_row",
                insert_type: "append",
                insert_pos: 1,
                content: [
                    "{{__1.invoice_code}}",
                    "{{__1.invoice_number}}",
                    "{{__1.title}}",
                    "{{__1.issue_date}}",
                    "{{__1.buyer_name}}",
                    "{{__1.buyer_tax_id}}",
                    "{{__1.item_name}}",
                    "{{__1.amount}}",
                    "{{__1.total_amount_in_words}}",
                    "{{__1.total_amount_numeric}}",
                    "{{__1.seller_name}}",
                    "{{__1.seller_tax_id}}",
                    "{{__1.total_amount_excluding_tax}}",
                    "{{__1.total_tax_amount}}",
                    "{{__1.verification_code}}",
                    "{{__1.tax_rate}}",
                    "{{__1.tax_amount}}",
                ],
            },
        },
    ],
};

/**自动识别身份证信息并同步至表格 */
export const identifyIdCard = {
    templateId: "identifyIdCard",
    title: "template.identifyIdCard",
    description: "description.identifyIdCard",
    dependency: ["@anyshare/ocr/general"],
    actions: [
        "@anyshare-trigger/upload-file",
        "@anyshare/ocr/idcard",
        "@anyshare/file/editexcel",
    ],
    steps: [
        {
            id: "0",
            operator: "@anyshare-trigger/upload-file",
            parameters: {
                docids: null,
                inherit: true,
            },
        },
        {
            id: "1",
            operator: "@anyshare/ocr/idcard",
            parameters: {
                docid: "{{__0.id}}",
            },
        },
        {
            id: "2",
            operator: "@anyshare/file/editexcel",
            parameters: {
                docid: null,
                new_type: "new_row",
                insert_type: "append",
                insert_pos: 1,
                content: [
                    "{{__1.name}}",
                    "{{__1.gender}}",
                    "{{__1.date_of_birth}}",
                    "{{__1.ethnicity}}",
                    "{{__1.address}}",
                    "{{__1.id_number}}",
                    "{{__1.issuing_authority}}",
                    "{{__1.expiration_date}}",
                ],
            },
        },
    ],
};

/**
 * 数据收集
 */
/**自动创建项目文件夹目录 */
export const directory = {
    templateId: "directory",
    title: "template.directory",
    description: "description.directory",
    actions: [
        "@trigger/manual",
        "@anyshare/folder/create",
        "@anyshare/folder/create",
        "@anyshare/folder/create",
    ],
    steps: [
        {
            id: "0",
            title: "",
            operator: "@trigger/manual",
        },
        {
            id: "1",
            title: "",
            operator: "@anyshare/folder/create",
            parameters: {
                docid: null,
                name: "建筑工程项目管理",
                ondup: 2,
            },
        },
        {
            id: "2",
            title: "",
            operator: "@anyshare/folder/create",
            parameters: {
                docid: "{{__1.docid}}",
                name: "方案设计",
                ondup: 2,
            },
        },
        {
            id: "3",
            title: "",
            operator: "@anyshare/folder/create",
            parameters: {
                docid: "{{__1.docid}}",
                name: "施工图设计",
                ondup: 2,
            },
        },
    ],
};

/**
 * 数据同步
 */

/**基于文件创建时间设置自动归档流程 */
export const automaticArchiving = {
    templateId: "automaticArchiving",
    title: "template.automaticArchiving",
    description: "description.automaticArchiving",
    actions: ["@trigger/manual", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            operator: "@trigger/manual",
            dataSource: {
                id: "1",
                operator: "@anyshare-data/list-files",
                parameters: {
                    docid: null,
                },
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
                                id: "7",
                                parameters: {
                                    a: "{{__1.create_time}}",
                                    b: null,
                                },
                                operator: "@internal/cmp/date-earlier-than",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "4",
                            operator: "@anyshare/file/move",
                            parameters: {
                                destparent: null,
                                docid: "{{__1.id}}",
                                ondup: 2,
                            },
                        },
                    ],
                },
                {
                    id: "5",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/** 自动批量清除文件*/
export const batchDeletion = {
    templateId: "batchDeletion",
    title: "template.batchDeletion",
    description: "description.batchDeletion",
    actions: ["@trigger/manual", "@control/flow/branches"],
    steps: [
        {
            id: "0",
            operator: "@trigger/manual",
            dataSource: {
                id: "2",
                operator: "@anyshare-data/list-files",
                parameters: {
                    docid: null,
                },
            },
        },
        {
            id: "3",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "4",
                    conditions: [
                        [
                            {
                                id: "7",
                                parameters: {
                                    a: "{{__2.name}}",
                                    b: null,
                                },
                                operator: "@internal/cmp/string-contains",
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "5",
                            operator: "@anyshare/file/remove",
                            parameters: {
                                docid: "{{__2.id}}",
                            },
                        },
                    ],
                },
                {
                    id: "6",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

/** 每周定时清理上传时间超过一年的文件*/
export const regularDeleteFiles = {
    templateId: "regularDeleteFiles",
    title: "template.regularDeleteFiles",
    description: "description.regularDeleteFiles",
    actions: [
        "@trigger/cron/week",
        "@internal/time/now",
        "@internal/time/relative",
        "@control/flow/branches",
    ],
    steps: [
        {
            id: "0",
            operator: "@trigger/cron/week",
            parameters: {
                cron: "0 0 0 ? * 1",
            },
            dataSource: {
                id: "6",
                operator: "@anyshare-data/list-files",
                parameters: {
                    docid: null,
                    depth: -1,
                },
            },
        },
        {
            id: "1",
            operator: "@internal/time/now",
        },
        {
            id: "7",
            operator: "@internal/time/relative",
            parameters: {
                old_time: "{{__1.curtime}}",
                relative_type: "sub",
                relative_value: 365,
                relative_unit: "day",
            },
        },
        {
            id: "8",
            operator: "@control/flow/branches",
            branches: [
                {
                    id: "9",
                    conditions: [
                        [
                            {
                                id: "12",
                                operator: "@internal/cmp/date-earlier-than",
                                parameters: {
                                    a: "{{__6.create_time}}",
                                    b: "{{__7.new_time}}",
                                },
                            },
                        ],
                    ],
                    steps: [
                        {
                            id: "10",
                            operator: "@anyshare/file/remove",
                            parameters: {
                                docid: "{{__6.id}}",
                            },
                        },
                    ],
                },
                {
                    id: "11",
                    conditions: [],
                    steps: [],
                },
            ],
        },
    ],
};

export interface ITemplate {
    templateId: string;
    title: string;
    description: string;
    actions: string[];
    steps: IStep[];
}

export const enum SubCategories {
    "All" = "0",
    /** 协同办公*/
    "Collaboration" = "1",
    /** 内容提取*/
    "ContentExtraction" = "2",
    /** 数据收集*/
    "DataCollection" = "3",
    /** 数据同步*/
    "DataSync" = "4",
    /** 消息提醒*/
    "MessageReminder" = "5",
}

export interface ITaskTemplate {
    name: string;
    type: SubCategories;
    template: any;
    dependency?: string[];
}

export const taskTemplates: ITaskTemplate[] = [
    // 协同办公
    {
        name: deleteApproval.title,
        type: SubCategories.Collaboration,
        template: deleteApproval,
        dependency: deleteApproval.dependency,
    },
    {
        name: renameApproval.title,
        type: SubCategories.Collaboration,
        template: renameApproval,
        dependency: renameApproval.dependency,
    },
    {
        name: permission.title,
        type: SubCategories.Collaboration,
        template: permission,
        dependency: permission.dependency,
    },
    {
        name: contractRelay.title,
        type: SubCategories.Collaboration,
        template: contractRelay,
        dependency: contractRelay.dependency,
    },
    {
        name: expansion.title,
        type: SubCategories.Collaboration,
        template: expansion,
        dependency: expansion.dependency,
    },
    {
        name: docRelay.title,
        type: SubCategories.Collaboration,
        template: docRelay,
        dependency: docRelay.dependency,
    },
    {
        name: knowledgeFlow.title,
        type: SubCategories.Collaboration,
        template: knowledgeFlow,
        dependency: knowledgeFlow.dependency,
    },

    // 内容提取
    {
        name: tagging.title,
        type: SubCategories.ContentExtraction,
        template: tagging,
    },
    {
        name: setcsfLevel.title,
        type: SubCategories.ContentExtraction,
        template: setcsfLevel,
    },
    {
        name: matchTextForTemplate.title,
        type: SubCategories.ContentExtraction,
        template: matchTextForTemplate,
    },
    {
        name: getPageForTemplate.title,
        type: SubCategories.ContentExtraction,
        template: getPageForTemplate,
    },
    {
        name: recognizeResume.title,
        type: SubCategories.ContentExtraction,
        template: recognizeResume,
        dependency: recognizeResume.dependency,
    },
    {
        name: recognizeMove.title,
        type: SubCategories.ContentExtraction,
        template: recognizeMove,
        dependency: recognizeMove.dependency,
    },
    {
        name: docSummary.title,
        type: SubCategories.ContentExtraction,
        template: docSummary,
        dependency: docSummary.dependency,
    },
    {
        name: meetingSummary.title,
        type: SubCategories.ContentExtraction,
        template: meetingSummary,
        dependency: meetingSummary.dependency,
    },
    {
        name: identifyInvoice.title,
        type: SubCategories.ContentExtraction,
        template: identifyInvoice,
        dependency: identifyInvoice.dependency,
    },
    {
        name: identifyIdCard.title,
        type: SubCategories.ContentExtraction,
        template: identifyIdCard,
        dependency: identifyIdCard.dependency,
    },

    // 数据收集
    {
        name: directory.title,
        type: SubCategories.DataCollection,
        template: directory,
    },
    {
        name: identifyInvoice.title,
        type: SubCategories.DataCollection,
        template: identifyInvoice,
        dependency: identifyInvoice.dependency,
    },
    {
        name: identifyIdCard.title,
        type: SubCategories.DataCollection,
        template: identifyIdCard,
        dependency: identifyIdCard.dependency,
    },
    // 数据同步
    {
        name: automaticArchiving.title,
        type: SubCategories.DataSync,
        template: automaticArchiving,
    },
    {
        name: batchDeletion.title,
        type: SubCategories.DataSync,
        template: batchDeletion,
    },
    {
        name: regularDeleteFiles.title,
        type: SubCategories.DataSync,
        template: regularDeleteFiles,
    },
];
