import { IStep } from "../../editor/expr";
import { TriggerType } from "../types";
import { IAtlasInfo, ISelectAtlasInfo, ItemType } from "./select-atlas";

interface Trigger {
    operator: string;
    dataSource?: {
        operator: string;
        parameters: {
            accessorid?: string;
            [key: string]: any;
        }
    },
    cron?: string;
    parameters?: {
        docids?: string[];
        accessorid?: string;
    }
}

export interface IWorkflow {
    id: string;
    title: string;
    steps: IStep[];
    trigger_config: Trigger;
    trigger?: TriggerType;
}

export enum CreateType {
    CreateIndex = "createIndex",
    UpdateAtlas = "updateAtlas",
    PdfParse = "pdfParse"
}

const createFileSteps = [
    { id: "0", title: "", operator: "@trigger/dataflow-doc" },
    {
        id: "1",
        title: "",
        operator: "@control/flow/branches",
        branches: [
            {
                id: "2",
                conditions: [
                    [
                        {
                            id: "35",
                            parameters: {
                                a: "{{__0.name}}",
                                b: "(?i)\\.(doc|docx|pdf|txt|rtf|odt|xls|xlsx|csv|ppt|pptx|pages|numbers|key|xml|json|md|markdown|tex|log|ini|conf|yaml|yml|toml|epub|mobi|azw3|djvu|chm|wps|et|dps)$",
                            },
                            operator: "@internal/cmp/string-match",
                        },
                    ],
                ],
                steps: [
                    // {
                    //     id: "3",
                    //     title: "",
                    //     operator: "@content/entity",
                    //     parameters: {
                    //         docid: "{{__0.id}}",
                    //         edge_ids: ["edge_idc292332f-7d03-4d94-9e67-3a8ff8e90bb2"],
                    //         entity_ids: ["entity_idfc058d22-c844-4e4e-9aa4-9bae97a13259"],
                    //         graph_id: 3,
                    //         version: "{{__0.rev}}",
                    //     },
                    // },
                    // {
                    //     id: "9",
                    //     title: "",
                    //     operator: "@content/abstract",
                    //     parameters: { docid: "{{__0.id}}", version: "{{__0.rev}}" },
                    // },
                    // {
                    //     id: "10",
                    //     title: "",
                    //     operator: "@internal/json/template",
                    //     parameters: {
                    //         json: "{{__3.data}}",
                    //         template:
                    //             '{\n\t\t{{- $output := dict -}}\n\t\t{{- range .relationships }}\n\t\t\t\t{{- $key := .end.name }}\n\t\t\t\t{{- $value := .end.id }}\n\t\t\t\t{{- if not (hasKey $output $key) }}\n\t\t\t\t\t\t{{- $output = merge $output (dict $key (list $value)) }}\n\t\t\t\t{{- else }}\n\t\t\t\t\t\t{{- $values := get $output $key }}\n\t\t\t\t\t\t{{- $values = append $values $value }}\n\t\t\t\t\t\t{{- $output = merge $output (dict $key $values) }}\n\t\t\t\t{{- end }}\n\t\t{{- end }}\n\t\t{{- $first := true }}\n\t\t{{- range $key, $values := $output }}\n\t\t\t\t{{- if not $first }} , {{- end }}\n\t\t\t\t{{- $first = false }}\n\t\t\t\t"{{ $key }}": [\n\t\t\t\t\t\t{{- range $i, $val := $values }}\n\t\t\t\t\t\t\t\t{{- if $i }},{{ end }}\n\t\t\t\t\t\t\t\t"{{ $val }}"\n\t\t\t\t\t\t{{- end }}\n\t\t\t\t]\n\t\t{{- end }}\n}',
                    //     },
                    // },
                    {
                        id: "11",
                        title: "",
                        operator: "@internal/json/set",
                        parameters: {
                            fields: [
                                { key: "id", type: "string", value: "{{__0.item_id}}" },
                                { key: "name", type: "string", value: "{{__0.name}}" },
                                { key: "rev", type: "string", value: "{{__0.rev}}" },
                                {
                                    key: "create_time",
                                    type: "string",
                                    value: "{{__0.create_time}}",
                                },
                                {
                                    key: "modify_time",
                                    type: "string",
                                    value: "{{__0.modify_time}}",
                                },
                                { key: "size", type: "number", value: "{{__0.size}}" },
                                { key: "path", type: "string", value: "{{__0.path}}" },
                                {
                                    key: "csflevel",
                                    type: "number",
                                    value: "{{__0.csflevel}}",
                                },
                                {
                                    key: "creator",
                                    type: "string",
                                    value: "{{__0.creator_id}}",
                                },
                                { key: "editor", type: "string", value: "{{__0.editor_id}}" },
                                { key: "docid", type: "string", value: "{{__0.docid}}" },
                                { key: "abstract", type: "string", value: "" },
                            ],
                            json: "",
                        },
                    },
                    {
                        id: "16",
                        title: "",
                        operator: "@intelliinfo/transfer",
                        parameters: {
                            data: "{{__11.json}}",
                            rule_id: "document_upsert_v2",
                        },
                    },
                ],
            },
            {
                id: "4",
                conditions: [
                    [
                        {
                            id: "36",
                            parameters: {
                                a: "{{__0.name}}",
                                b: "(?i)\\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif|heic|heif|raw|cr2|nef|arw|dng|psd|ai|eps|xcf)$",
                            },
                            operator: "@internal/cmp/string-match",
                        },
                    ],
                ],
                steps: [
                    {
                        id: "5",
                        title: "",
                        operator: "@internal/json/set",
                        parameters: {
                            fields: [
                                { key: "id", type: "string", value: "{{__0.item_id}}" },
                                { key: "docid", type: "string", value: "{{__0.docid}}" },
                                { key: "name", type: "string", value: "{{__0.name}}" },
                                { key: "rev", type: "string", value: "{{__0.rev}}" },
                                {
                                    key: "create_time",
                                    type: "string",
                                    value: "{{__0.create_time}}",
                                },
                                {
                                    key: "modify_time",
                                    type: "string",
                                    value: "{{__0.modify_time}}",
                                },
                                { key: "size", type: "number", value: "{{__0.size}}" },
                                { key: "path", type: "string", value: "{{__0.path}}" },
                                {
                                    key: "csflevel",
                                    type: "number",
                                    value: "{{__0.csflevel}}",
                                },
                                {
                                    key: "creator",
                                    type: "string",
                                    value: "{{__0.creator_id}}",
                                },
                                { key: "editor", type: "string", value: "{{__0.editor_id}}" },
                                { key: "abstract", type: "string", value: "" },
                            ],
                            json: "",
                        },
                    },
                    {
                        id: "17",
                        title: "",
                        operator: "@intelliinfo/transfer",
                        parameters: {
                            data: "{{__5.json}}",
                            rule_id: "document_upsert_v2",
                        },
                    },
                ],
            },
            {
                id: "13",
                conditions: [
                    [
                        {
                            id: "37",
                            parameters: {
                                a: "{{__0.name}}",
                                b: "(?i)\\.(mp4|avi|mkv|flv|mov|wmv|webm|m4v|3gp|mpg|mpeg|rm|rmvb|vob|ts|mp3|wav|wma|aac|ogg|flac|m4a|ac3|mid|midi|ape|alac|aiff|caf|mka|opus|ra)$",
                            },
                            operator: "@internal/cmp/string-match",
                        },
                    ],
                ],
                steps: [
                    // {
                    //     id: "39",
                    //     title: "",
                    //     operator: "@content/abstract",
                    //     parameters: { docid: "{{__0.id}}", version: "{{__0.rev}}" },
                    // },
                    {
                        id: "12",
                        title: "",
                        operator: "@internal/json/set",
                        parameters: {
                            fields: [
                                { key: "id", type: "string", value: "{{__0.item_id}}" },
                                { key: "docid", type: "string", value: "{{__0.docid}}" },
                                { key: "name", type: "string", value: "{{__0.name}}" },
                                { key: "rev", type: "string", value: "{{__0.rev}}" },
                                {
                                    key: "create_time",
                                    type: "string",
                                    value: "{{__0.create_time}}",
                                },
                                {
                                    key: "modify_time",
                                    type: "string",
                                    value: "{{__0.modify_time}}",
                                },
                                { key: "size", type: "number", value: "{{__0.size}}" },
                                { key: "path", type: "string", value: "{{__0.path}}" },
                                {
                                    key: "csflevel",
                                    type: "number",
                                    value: "{{__0.csflevel}}",
                                },
                                {
                                    key: "creator",
                                    type: "string",
                                    value: "{{__0.creator_id}}",
                                },
                                { key: "editor", type: "string", value: "{{__0.editor_id}}" },
                                { key: "abstract", type: "string", value: "{{__39.data}}" },
                            ],
                            json: "",
                        },
                    },
                    {
                        id: "26",
                        title: "",
                        operator: "@intelliinfo/transfer",
                        parameters: {
                            data: "{{__12.json}}",
                            rule_id: "document_upsert_v2",
                        },
                    },
                ],
            },
            {
                id: "41",
                conditions: [
                    [
                        {
                            id: "42",
                            parameters: {
                                a: "{{__0.name}}",
                                b: "(?i)\\.(zip|rar|7z|tar|gz|bz2|xz|tgz|tbz2|txz|z|lz|lzma|zst|br|iso|dmg|exe|msi|dll|app|command|sh|bat|cmd|ps1|vbs|apk|deb|rpm|pkg|run|bin|so|dylib|jar|class|py|php|rb|pl|js|go|db|sqlite|sqlite3|mdb|accdb|frm|myd|myi|ibd|dbf|odb|sql|bak|bson|ttf|otf|woff|woff2|eot|fon|fnt|pfm|pfb|obj|fbx|3ds|max|blend|dae|stl|step|stp|iges|igs|dwg|dxf|skp|sys|ini|cfg|reg|log|tmp|temp|cache|bak|old|swp)$",
                            },
                            operator: "@internal/cmp/string-match",
                        },
                    ],
                ],
                steps: [
                    {
                        id: "40",
                        title: "",
                        operator: "@internal/json/set",
                        parameters: {
                            fields: [
                                { key: "id", type: "string", value: "{{__0.item_id}}" },
                                { key: "docid", type: "string", value: "{{__0.docid}}" },
                                { key: "name", type: "string", value: "{{__0.name}}" },
                                { key: "rev", type: "string", value: "{{__0.rev}}" },
                                {
                                    key: "create_time",
                                    type: "string",
                                    value: "{{__0.create_time}}",
                                },
                                {
                                    key: "modify_time",
                                    type: "string",
                                    value: "{{__0.modify_time}}",
                                },
                                { key: "size", type: "number", value: "{{__0.size}}" },
                                { key: "path", type: "string", value: "{{__0.path}}" },
                                {
                                    key: "csflevel",
                                    type: "number",
                                    value: "{{__0.csflevel}}",
                                },
                                {
                                    key: "creator",
                                    type: "string",
                                    value: "{{__0.creator_id}}",
                                },
                                { key: "editor", type: "string", value: "{{__0.editor_id}}" },
                                { key: "abstract", type: "string", value: "" },
                            ],
                            json: "",
                        },
                    },
                    {
                        id: "43",
                        title: "",
                        operator: "@intelliinfo/transfer",
                        parameters: {
                            data: "{{__40.json}}",
                            rule_id: "document_upsert_v2",
                        },
                    },
                ],
            },
        ],
    },
]

export const ReIndexTemplates: IWorkflow[] = [
    {
        "id": "1",
        "title": "定时创建索引",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-doc"
            },
            {
                "id": "1",
                "operator": "@ecoconfig/reindex",
                "parameters": {
                    "part_type": "all",
                    "docid": "{{__0.docid}}"
                }
            }
        ],
        "trigger_config": {
            cron: '0 30 1 * * ?',
            "operator": "@trigger/cron",
        },
        trigger: TriggerType.CRON,
    },
    {
        "id": "2",
        "title": "新增文件版本时自动创建索引",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-doc"
            },
            {
                "id": "1",
                "operator": "@ecoconfig/reindex",
                "parameters": {
                    "part_type": "all",
                    "docid": "{{__0.docid}}"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/file-version-update",
        },
        trigger: TriggerType.EVENT,
    }
]

export const PdfParseTemplates: IWorkflow[] = [
    {
        "id": "1",
        "title": "新增文件版本时自动解析",
        "steps": [
            {
                "id": "0",
                "title": "",
                "operator": "@trigger/dataflow-doc"
            },
            {
                "id": "1",
                "title": "",
                "operator": "@content/file_parse",
                "parameters": {
                    "docid": "{{__0.id}}",
                    "model": "embedding",
                    "slice_vector": "slice_vector",
                    "source_type": "docid",
                    "version": "{{__0.rev}}"
                }
            },
            {
                "id": "1001",
                "title": "写入向量",
                "operator": "@opensearch/bulk-upsert",
                "parameters": {
                    "base_type": "content_index",
                    "category": "log",
                    "data_type": "user9",
                    "documents": "{{__1.chunks}}",
                    "template": "default"
                }
            },
            {
                "id": "1002",
                "title": "写入元素",
                "operator": "@opensearch/bulk-upsert",
                "parameters": {
                    "base_type": "content_element",
                    "category": "log",
                    "data_type": "user9",
                    "documents": "{{__1.content_list}}"
                }
            },
            {
                "id": "1003",
                "title": "写入文件元信息",
                "operator": "@opensearch/bulk-upsert",
                "parameters": {
                    "base_type": "content_document",
                    "category": "log",
                    "data_type": "user9",
                    "documents": "{  \"id\": \"{{__0.item_id}}\",\n  \"rev\": \"{{__0.rev}}\",\n  \"name\": \"{{__0.name}}\"}"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/file-version-update",
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "2",
        "title": "定时解析文件",
        "steps": [
            {
                "id": "0",
                "title": "",
                "operator": "@trigger/dataflow-doc"
            },
            {
                "id": "1",
                "title": "",
                "operator": "@content/file_parse",
                "parameters": {
                    "docid": "{{__0.id}}",
                    "model": "embedding",
                    "slice_vector": "slice_vector",
                    "source_type": "docid",
                    "version": "{{__0.rev}}"
                }
            },
            {
                "id": "1001",
                "title": "写入向量",
                "operator": "@opensearch/bulk-upsert",
                "parameters": {
                    "base_type": "content_index",
                    "category": "log",
                    "data_type": "user9",
                    "documents": "{{__1.chunks}}",
                    "template": "default"
                }
            },
            {
                "id": "1002",
                "title": "写入元素",
                "operator": "@opensearch/bulk-upsert",
                "parameters": {
                    "base_type": "content_element",
                    "category": "log",
                    "data_type": "user9",
                    "documents": "{{__1.content_list}}"
                }
            },
            {
                "id": "1003",
                "title": "写入文件元信息",
                "operator": "@opensearch/bulk-upsert",
                "parameters": {
                    "base_type": "content_document",
                    "category": "log",
                    "data_type": "user9",
                    "documents": "{  \"id\": \"{{__0.item_id}}\",\n  \"rev\": \"{{__0.rev}}\",\n  \"name\": \"{{__0.name}}\"}"
                }
            }
        ],
        "trigger_config": {
            cron: '0 30 1 * * ?',
            "operator": "@trigger/cron",
        },
        trigger: TriggerType.CRON,
    },
]


export const AtlasTemplate: IWorkflow[] = [
    {
        "id": "1",
        "title": "新增文件版本时自动更新知识网络",
        "steps": createFileSteps,
        "trigger_config": {
            "operator": "@anyshare-trigger/file-version-update",
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "2",
        "title": "修改文件路径时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "title": "",
                "operator": "@trigger/dataflow-doc"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "{}",
                    "fields": [
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.docid}}"
                        },
                        {
                            "key": "item_id",
                            "type": "string",
                            "value": "{{__0.item_id}}"
                        },
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "rev",
                            "type": "string",
                            "value": "{{__0.rev}}"
                        },
                        {
                            "key": "create_time",
                            "type": "string",
                            "value": "{{__0.create_time}}"
                        },
                        {
                            "key": "modify_time",
                            "type": "string",
                            "value": "{{__0.modify_time}}"
                        },
                        {
                            "key": "size",
                            "type": "number",
                            "value": "{{__0.size}}"
                        },
                        {
                            "key": "path",
                            "type": "string",
                            "value": "{{__0.path}}"
                        },
                        {
                            "key": "csflevel",
                            "type": "number",
                            "value": "{{__0.csflevel}}"
                        },
                        {
                            "key": "creator_id",
                            "type": "string",
                            "value": "{{__0.creator_id}}"
                        },
                        {
                            "key": "editor_id",
                            "type": "string",
                            "value": "{{__0.editor_id}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "title": "",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "document_update_v2"
                }
            }
        ],
        trigger_config: {
            operator: "@anyshare-trigger/file-path-update",
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "3",
        title: "删除文件时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-doc"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "{}",
                    "fields": [
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.docid}}"
                        },
                        {
                            "key": "item_id",
                            "type": "string",
                            "value": "{{__0.item_id}}"
                        },
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "path",
                            "type": "string",
                            "value": "{{__0.path}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "document_delete"
                }
            }
        ],
        trigger_config: {
            operator: "@anyshare-trigger/file-version-delete",
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "4",
        "title": "定时将文件同步至知识网络",
        "steps": createFileSteps,
        "trigger_config": {
            cron: '0 30 1 * * ?',
            "operator": "@trigger/cron",
        },
        trigger: TriggerType.CRON,
    },
    {
        "id": "5",
        title: "定时将用户信息同步至知识网络",
        "steps": [
            {
                "id": "0",
                "title": "",
                "operator": "@trigger/dataflow-user"
            },
            {
                "id": "3",
                "title": "",
                "operator": "@internal/tool/py3",
                "parameters": {
                    "code": "import re\n\ndef main(name):\n    pattern = re.compile(r'([\\u4e00-\\u9fff-]+)\\s*（\\s*([A-Za-z\\s]+)\\s*）')\n    match = pattern.search(name)\n    if match:\n        chinese_name = match.group(1).strip()\n        english_name = match.group(2).strip()\n        return chinese_name, english_name\n    return name, ''",
                    "input_params": [
                        {
                            "id": "16utl",
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        }
                    ],
                    "output_params": [
                        {
                            "id": "rfno6",
                            "key": "chinese_name",
                            "type": "string"
                        },
                        {
                            "id": "oa8ql",
                            "key": "english_name",
                            "type": "string"
                        }
                    ]
                }
            },
            {
                "id": "1",
                "title": "",
                "operator": "@internal/json/set",
                "parameters": {
                    "fields": [
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__3.chinese_name}}"
                        },
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "role",
                            "type": "array",
                            "value": "{{__0.role}}"
                        },
                        {
                            "key": "status",
                            "type": "string",
                            "value": "{{__0.status}}"
                        },
                        {
                            "key": "contact",
                            "type": "string",
                            "value": "{{__0.contact}}"
                        },
                        {
                            "key": "email",
                            "type": "string",
                            "value": "{{__0.email}}"
                        },
                        {
                            "key": "parent_id",
                            "type": "array",
                            "value": "{{__0.parent_ids}}"
                        },
                        {
                            "key": "tags",
                            "type": "array",
                            "value": "{{__0.tags}}"
                        },
                        {
                            "key": "is_expert",
                            "type": "boolean",
                            "value": "{{__0.is_expert}}"
                        },
                        {
                            "key": "verfication_info",
                            "type": "array",
                            "value": "{{__0.verification_info}}"
                        },
                        {
                            "key": "university",
                            "type": "array",
                            "value": "{{__0.university}}"
                        },
                        {
                            "key": "position",
                            "type": "string",
                            "value": "{{__0.position}}"
                        },
                        {
                            "key": "work_at",
                            "type": "string",
                            "value": "{{__0.work_at}}"
                        },
                        {
                            "key": "professional",
                            "type": "array",
                            "value": "{{__0.professional}}"
                        },
                        {
                            "key": "csflevel",
                            "type": "number",
                            "value": "{{__0.csflevel}}"
                        },
                        {
                            "key": "old_parent_ids",
                            "type": "string",
                            "value": "{{__0.old_parent_ids}}"
                        },
                        {
                            "key": "english_name",
                            "type": "string",
                            "value": "{{__3.english_name}}"
                        }
                    ],
                    "json": ""
                }
            },
            {
                "id": "2",
                "title": "",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "person_upsert"
                }
            }
        ],
        trigger_config: {
            cron: '0 30 0 * * ?',
            operator: "@trigger/cron",
            dataSource: {
                operator: "@anyshare-data/user",
                parameters: {
                    accessorid: "00000000-0000-0000-0000-000000000000"
                }
            }
        },
        trigger: TriggerType.CRON,
    },
    {
        "id": "6",
        "title": "定时将组织或部门信息同步至知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-dept"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "{}",
                    "fields": [
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "parent_id",
                            "type": "string",
                            "value": "{{__0.parent_id}}"
                        },
                        {
                            "key": "parent",
                            "type": "string",
                            "value": "{{__0.parent}}"
                        },
                        {
                            "key": "email",
                            "type": "string",
                            "value": "{{__0.email}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "orgnization_upsert"
                }
            }
        ],
        "trigger_config": {
            cron: '0 0 0 * * ?',
            "operator": "@trigger/cron",
            "dataSource": {
                "operator": "@anyshare-data/dept-tree",
                "parameters": {
                    "accessorid": "00000000-0000-0000-0000-000000000000"
                }
            }
        },
        trigger: TriggerType.CRON,
    },
    // {
    //     "id": "7",
    //     "title": "定时将标签树同步至知识网络",
    //     "steps": [
    //         {
    //             "id": "0",
    //             "operator": "@trigger/dataflow-tag"
    //         },
    //         {
    //             "id": "1",
    //             "operator": "@internal/json/set",
    //             "parameters": {
    //                 "json": "",
    //                 "fields": [
    //                     {
    //                         "key": "id",
    //                         "type": "string",
    //                         "value": "{{__0.id}}"
    //                     },
    //                     {
    //                         "key": "path",
    //                         "type": "string",
    //                         "value": "{{__0.path}}"
    //                     },
    //                     {
    //                         "key": "name",
    //                         "type": "string",
    //                         "value": "{{__0.name}}"
    //                     },
    //                     {
    //                         "key": "parent_id",
    //                         "type": "string",
    //                         "value": "{{__0.parent_id}}"
    //                     },
    //                     {
    //                         "key": "version",
    //                         "type": "number",
    //                         "value": "{{__0.version}}"
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             "id": "2",
    //             "operator": "@intelliinfo/transfer",
    //             "parameters": {
    //                 "data": "{{__1.json}}",
    //                 "rule_id": "tag_upsert"
    //             }
    //         }
    //     ],
    //     "trigger_config": {
    //         cron: '0 0 1 * * ?',
    //         "operator": "@trigger/cron",
    //         "dataSource": {
    //             "operator": "@anyshare-data/tag-tree",
    //             "parameters": {}
    //         }
    //     },
    //     trigger: TriggerType.CRON,
    // },
    {
        "id": "8",
        "title": "创建用户时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "title": "",
                "operator": "@trigger/dataflow-user"
            },
            {
                "id": "3",
                "title": "",
                "operator": "@internal/tool/py3",
                "parameters": {
                    "code": "import re\n\ndef main(name):\n    pattern = re.compile(r'([\\u4e00-\\u9fff-]+)\\s*（\\s*([A-Za-z\\s]+)\\s*）')\n    match = pattern.search(name)\n    if match:\n        chinese_name = match.group(1).strip()\n        english_name = match.group(2).strip()\n        return chinese_name, english_name\n    return name, ''",
                    "input_params": [
                        {
                            "id": "dzh9x",
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        }
                    ],
                    "output_params": [
                        {
                            "id": "olooe",
                            "key": "chinese_name",
                            "type": "string"
                        },
                        {
                            "id": "n1yx9",
                            "key": "english_name",
                            "type": "string"
                        }
                    ]
                }
            },
            {
                "id": "1",
                "title": "",
                "operator": "@internal/json/set",
                "parameters": {
                    "fields": [
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__3.chinese_name}}"
                        },
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "role",
                            "type": "array",
                            "value": "{{__0.role}}"
                        },
                        {
                            "key": "status",
                            "type": "string",
                            "value": "{{__0.status}}"
                        },
                        {
                            "key": "contact",
                            "type": "string",
                            "value": "{{__0.contact}}"
                        },
                        {
                            "key": "email",
                            "type": "string",
                            "value": "{{__0.email}}"
                        },
                        {
                            "key": "parent_id",
                            "type": "array",
                            "value": "{{__0.parent_ids}}"
                        },
                        {
                            "key": "tags",
                            "type": "array",
                            "value": "{{__0.tags}}"
                        },
                        {
                            "key": "is_expert",
                            "type": "boolean",
                            "value": "{{__0.is_expert}}"
                        },
                        {
                            "key": "verfication_info",
                            "type": "array",
                            "value": "{{__0.verification_info}}"
                        },
                        {
                            "key": "university",
                            "type": "array",
                            "value": "{{__0.university}}"
                        },
                        {
                            "key": "position",
                            "type": "string",
                            "value": "{{__0.position}}"
                        },
                        {
                            "key": "work_at",
                            "type": "string",
                            "value": "{{__0.work_at}}"
                        },
                        {
                            "key": "professional",
                            "type": "array",
                            "value": "{{__0.professional}}"
                        },
                        {
                            "key": "csflevel",
                            "type": "number",
                            "value": "{{__0.csflevel}}"
                        },
                        {
                            "key": "old_parent_ids",
                            "type": "string",
                            "value": "{{__0.old_parent_ids}}"
                        },
                        {
                            "key": "english_name",
                            "type": "string",
                            "value": "{{__3.english_name}}"
                        }
                    ],
                    "json": ""
                }
            },
            {
                "id": "2",
                "title": "",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "person_upsert"
                }
            }
        ],
        trigger_config: {
            operator: "@anyshare-trigger/create-user"
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "9",
        "title": "更新用户信息时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-user"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "",
                    "fields": [
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "role",
                            "type": "array",
                            "value": "{{__0.role}}"
                        },
                        {
                            "key": "status",
                            "type": "string",
                            "value": "{{__0.status}}"
                        },
                        {
                            "key": "contact",
                            "type": "string",
                            "value": "{{__0.contact}}"
                        },
                        {
                            "key": "email",
                            "type": "string",
                            "value": "{{__0.email}}"
                        },
                        {
                            "key": "parent_id",
                            "type": "array",
                            "value": "{{__0.parent_ids}}"
                        },
                        {
                            "key": "tags",
                            "type": "array",
                            "value": "{{__0.tags}}"
                        },
                        {
                            "key": "is_expert",
                            "type": "boolean",
                            "value": "{{__0.is_expert}}"
                        },
                        {
                            "key": "vertification_info",
                            "type": "array",
                            "value": "{{__0.verification_info}}"
                        },
                        {
                            "key": "university",
                            "type": "array",
                            "value": "{{__0.university}}"
                        },
                        {
                            "key": "position",
                            "type": "string",
                            "value": "{{__0.position}}"
                        },
                        {
                            "key": "work_at",
                            "type": "string",
                            "value": "{{__0.work_at}}"
                        },
                        {
                            "key": "professional",
                            "type": "array",
                            "value": "{{__0.professional}}"
                        },
                        {
                            "key": "csflevel",
                            "type": "number",
                            "value": "{{__0.csflevel}}"
                        },
                        {
                            "key": "old_parent_ids",
                            "type": "string",
                            "value": "{{__0.old_parent_ids}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "person_update"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/change-user"
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "10",
        "title": "用户删除时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-user"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "",
                    "fields": [
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "person_delete"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/delete-user"
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "11",
        "title": "创建新组织或部门时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-dept"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "{}",
                    "fields": [
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "parent_id",
                            "type": "string",
                            "value": "{{__0.parent_id}}"
                        },
                        {
                            "key": "parent",
                            "type": "string",
                            "value": "{{__0.parent}}"
                        },
                        {
                            "key": "email",
                            "type": "string",
                            "value": "{{__0.email}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "orgnization_upsert"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/create-dept"
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "12",
        "title": "移动部门时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-dept"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "{}",
                    "fields": [
                        {
                            "key": "name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "new_name",
                            "type": "string",
                            "value": "{{__0.name}}"
                        },
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "parent_id",
                            "type": "string",
                            "value": "{{__0.parent_id}}"
                        },
                        {
                            "key": "parent",
                            "type": "string",
                            "value": "{{__0.parent}}"
                        },
                        {
                            "key": "email",
                            "type": "string",
                            "value": "{{__0.email}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "orgnization_update"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/move-dept"
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "13",
        "title": "删除部门时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "operator": "@trigger/dataflow-dept"
            },
            {
                "id": "1",
                "operator": "@internal/json/set",
                "parameters": {
                    "json": "",
                    "fields": [
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        }
                    ]
                }
            },
            {
                "id": "2",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "orgnization_delete"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/delete-dept"
        },
        trigger: TriggerType.EVENT,
    },
    {
        "id": "14",
        "title": "更新用户所属部门信息时自动更新知识网络",
        "steps": [
            {
                "id": "0",
                "title": "",
                "operator": "@trigger/dataflow-user"
            },
            {
                "id": "1",
                "title": "",
                "operator": "@internal/json/set",
                "parameters": {
                    "fields": [
                        {
                            "key": "id",
                            "type": "string",
                            "value": "{{__0.id}}"
                        },
                        {
                            "key": "new_dept_path",
                            "type": "string",
                            "value": "{{__0.parent_ids}}"
                        },
                        {
                            "key": "old_dept_path",
                            "type": "string",
                            "value": "{{__0.old_parent_ids}}"
                        }
                    ],
                    "json": ""
                }
            },
            {
                "id": "2",
                "title": "",
                "operator": "@intelliinfo/transfer",
                "parameters": {
                    "data": "{{__1.json}}",
                    "rule_id": "orgnization_relation_update"
                }
            }
        ],
        "trigger_config": {
            "operator": "@anyshare-trigger/change-user"
        },
        trigger: TriggerType.EVENT,
    },
    // {
    //     "id": "15",
    //     "title": "创建新标签树时自动更新知识网络",
    //     "steps": [
    //         {
    //             "id": "0",
    //             "title": "",
    //             "operator": "@trigger/dataflow-tag"
    //         },
    //         {
    //             "id": "1",
    //             "title": "",
    //             "operator": "@internal/json/set",
    //             "parameters": {
    //                 "fields": [
    //                     {
    //                         "key": "id",
    //                         "type": "string",
    //                         "value": "{{__0.id}}"
    //                     },
    //                     {
    //                         "key": "path",
    //                         "type": "string",
    //                         "value": "{{__0.path}}"
    //                     },
    //                     {
    //                         "key": "name",
    //                         "type": "string",
    //                         "value": "{{__0.name}}"
    //                     },
    //                     {
    //                         "key": "parent_id",
    //                         "type": "string",
    //                         "value": "{{__0.parent_id}}"
    //                     },
    //                     {
    //                         "key": "version",
    //                         "type": "number",
    //                         "value": "{{__0.version}}"
    //                     }
    //                 ],
    //                 "json": ""
    //             }
    //         },
    //         {
    //             "id": "2",
    //             "title": "",
    //             "operator": "@intelliinfo/transfer",
    //             "parameters": {
    //                 "data": "{{__1.json}}",
    //                 "rule_id": "tag_upsert"
    //             }
    //         }
    //     ],
    //     "trigger_config": {
    //         "operator": "@anyshare-trigger/create-tag-tree"
    //     },
    //     trigger: TriggerType.EVENT,
    // },
    // {
    //     "id": "16",
    //     "title": "创建新标签时自动更新知识网络",
    //     "steps": [
    //         {
    //             "id": "0",
    //             "operator": "@trigger/dataflow-tag"
    //         },
    //         {
    //             "id": "1",
    //             "operator": "@internal/json/set",
    //             "parameters": {
    //                 "json": "",
    //                 "fields": [
    //                     {
    //                         "key": "id",
    //                         "type": "string",
    //                         "value": "{{__0.id}}"
    //                     },
    //                     {
    //                         "key": "path",
    //                         "type": "string",
    //                         "value": "{{__0.path}}"
    //                     },
    //                     {
    //                         "key": "name",
    //                         "type": "string",
    //                         "value": "{{__0.name}}"
    //                     },
    //                     {
    //                         "key": "parent_id",
    //                         "type": "string",
    //                         "value": "{{__0.parent_id}}"
    //                     },
    //                     {
    //                         "key": "version",
    //                         "type": "number",
    //                         "value": "{{__0.version}}"
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             "id": "2",
    //             "operator": "@intelliinfo/transfer",
    //             "parameters": {
    //                 "data": "{{__1.json}}",
    //                 "rule_id": "tag_update"
    //             }
    //         }
    //     ],
    //     "trigger_config": {
    //         "operator": "@anyshare-trigger/add-tag-tree"
    //     },
    //     trigger: TriggerType.EVENT,
    // },
    // {
    //     "id": "17",
    //     "title": "修改标签时自动更新知识网络",
    //     "steps": [
    //         {
    //             "id": "0",
    //             "operator": "@trigger/dataflow-tag"
    //         },
    //         {
    //             "id": "1",
    //             "operator": "@internal/json/set",
    //             "parameters": {
    //                 "json": "",
    //                 "fields": [
    //                     {
    //                         "key": "id",
    //                         "type": "string",
    //                         "value": "{{__0.id}}"
    //                     },
    //                     {
    //                         "key": "path",
    //                         "type": "string",
    //                         "value": "{{__0.path}}"
    //                     },
    //                     {
    //                         "key": "name",
    //                         "type": "string",
    //                         "value": "{{__0.name}}"
    //                     },
    //                     {
    //                         "key": "parent_id",
    //                         "type": "string",
    //                         "value": "{{__0.parent_id}}"
    //                     },
    //                     {
    //                         "key": "version",
    //                         "type": "number",
    //                         "value": "{{__0.version}}"
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             "id": "2",
    //             "operator": "@intelliinfo/transfer",
    //             "parameters": {
    //                 "data": "{{__1.json}}",
    //                 "rule_id": "tag_update"
    //             }
    //         }
    //     ],
    //     "trigger_config": {
    //         "operator": "@anyshare-trigger/edit-tag-tree"
    //     },
    //     trigger: TriggerType.EVENT,
    // },
    // {
    //     "id": "18",
    //     "title": "删除标签时自动更新知识网络",
    //     "steps": [
    //         {
    //             "id": "0",
    //             "operator": "@trigger/dataflow-tag"
    //         },
    //         {
    //             "id": "1",
    //             "operator": "@internal/json/set",
    //             "parameters": {
    //                 "json": "",
    //                 "fields": [
    //                     {
    //                         "key": "id",
    //                         "type": "string",
    //                         "value": "{{__0.id}}"
    //                     }
    //                 ]
    //             }
    //         },
    //         {
    //             "id": "2",
    //             "operator": "@intelliinfo/transfer",
    //             "parameters": {
    //                 "data": "{{__1.json}}",
    //                 "rule_id": "tag_delete"
    //             }
    //         }
    //     ],
    //     "trigger_config": {
    //         "operator": "@anyshare-trigger/delete-tag-tree"
    //     },
    //     trigger: TriggerType.EVENT,
    // }
];

const completeAtlasTemplate = (): Function => {
    // 新建文件，同步文件
    const fileFlows = ['1', '4']

    return (workflows: IWorkflow[], value: IAtlasInfo): IWorkflow[] => {
        const configValue = {
            graph_id: value.graph_id?.value,
            entity_ids: value.entity_ids?.map((item: ISelectAtlasInfo) => item.value),
            edge_ids: value.edge_ids?.map((item: ISelectAtlasInfo) => item.value),
        }

        return workflows.map((flow, i) => {
            let currentFlow = JSON.parse(JSON.stringify(flow));
            if (i < 3) {
                currentFlow.trigger_config = {
                    ...currentFlow.trigger_config,
                    parameters: value.selectedDoc,
                };
            }
            // 定时将文件同步至图谱
            if (i === 3) {
                currentFlow.trigger_config = {
                    ...currentFlow.trigger_config,
                    dataSource: {
                        operator: "@anyshare-data/list-files",
                        parameters: value.selectedDoc,
                    },
                };
            }
            if (fileFlows.includes(flow.id)) {
                currentFlow.steps[1].branches[0].steps[0].parameters = {
                    ...currentFlow.steps[1].branches[0].steps[0].parameters,
                    ...configValue
                };
                return currentFlow;
            }
            return currentFlow;
        })
    }
}

const completeCreateIndexTemplate = (workflows: IWorkflow[], value: IAtlasInfo): IWorkflow[] => {
    return workflows.map((flow, i) => {
        let currentFlow = JSON.parse(JSON.stringify(flow));

        // 定时创建索引
        if (i === 0) {
            currentFlow.trigger_config = {
                ...currentFlow.trigger_config,
                dataSource: {
                    operator: "@anyshare-data/list-files",
                    parameters: value.selectedDoc,
                },
            };
        }

        // 新增文件版本时自动创建索引
        if (i === 1) {
            currentFlow.trigger_config = {
                ...currentFlow.trigger_config,
                parameters: value.selectedDoc,
            };
        }

        return currentFlow;
    })
}

const completePdfParseTemplate = (workflows: IWorkflow[], value: IAtlasInfo): IWorkflow[] => {
    return workflows.map((flow, i) => {
        let currentFlow = JSON.parse(JSON.stringify(flow));

        // 定时解析PDF文件
        if (i === 1) {
            currentFlow.trigger_config = {
                ...currentFlow.trigger_config,
                dataSource: {
                    operator: "@anyshare-data/list-files",
                    parameters: value.selectedDoc,
                },
            };
        }

        // 新增PDF文件时自动解析
        if (i === 0) {
            currentFlow.trigger_config = {
                ...currentFlow.trigger_config,
                parameters: value.selectedDoc,
            };
        }

        return currentFlow;
    })
}




export const Templates = {
    [CreateType.UpdateAtlas]: {
        thirdTitle: "datastudio.create.selectAtlas", //"选择知识网络",
        fourthTitle: "datastudio.update.fromTemplate", //"更新知识网络"
        fourthDesc: "datastudio.create.templateFlows", //"知识网络处理共包含18条流程，您还需要完善流程配置:"
        workflows: AtlasTemplate,
        complete: completeAtlasTemplate()
    },
    [CreateType.CreateIndex]: {
        thirdTitle: "datastudio.create.selectscope",// "选择适用范围",
        fourthTitle: "datastudio.create.docIndex", // "创建文档索引"
        fourthDesc: "datastudio.create.templateFlowsIndex",// "创建文档索引共包含 2条流程，您还需要完善流程配置：",
        workflows: ReIndexTemplates,
        complete: completeCreateIndexTemplate,
        selectTypes: [ItemType.Doc]
    },
    [CreateType.PdfParse]: {
        thirdTitle: "datastudio.create.pdfParseConfig", //"配置PDF文档解析流程",
        fourthTitle: "datastudio.create.pdfParse", //"PDF文档智能解析"
        fourthDesc: "datastudio.create.templateFlowsPdfParse", //"PDF解析共包含 2条流程，您还需要完善流程配置：",
        workflows: PdfParseTemplates,
        complete: completePdfParseTemplate,
        selectTypes: [ItemType.Doc, ItemType.IndexBase]
    }
}

export interface Template {
    thirdTitle: string
    fourthTitle: string
    fourthDesc: string
    workflows: IWorkflow[]
    complete: any
    selectTypes?: ItemType[]
}
