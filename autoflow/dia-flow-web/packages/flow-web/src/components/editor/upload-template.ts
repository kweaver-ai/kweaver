import { defaultUploadTemplate, securityUploadTemplate } from "../../plugins/policy-template";

export interface ITemplate {
    key: string;
    title: string;
    description: string;
    steps: any;
}

export const uploadTemplate = [
    {
        key: "default",
        title: "uploadTemplate.default",
        description: "uploadTemplate.default.description",
        steps: defaultUploadTemplate,
    },

    // 涉密上传审核
    {
        key: "securityDefault",
        title: "uploadTemplate.securityDefault",
        description: "uploadTemplate.securityDefault.description",
        steps: securityUploadTemplate,
        is_security_level: true,
        dependency: ["@anyshare/doc/setallowsuffixdoc"]
    },
    // {
    //     key: "metadata",
    //     title: "uploadTemplate.metadata",
    //     description: "uploadTemplate.metadata.description",
    //     steps: [
    //         {
    //             id: "0",
    //             operator: "@trigger/security-policy",
    //             parameters: {
    //                 fields: [
    //                     {
    //                         key: "SpGlfEmtAVNGgyAS",
    //                         type: "asMetadata",
    //                         name: "文档编目",
    //                         required: true,
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "1",
    //             operator: "@anyshare/doc/settemplate",
    //             parameters: {
    //                 docid: "{{__0.source.id}}",
    //                 templates: "{{__0.fields.SpGlfEmtAVNGgyAS}}",
    //             },
    //         },
    //     ],
    // },
    // {
    //     key: "tag",
    //     title: "uploadTemplate.tag",
    //     description: "uploadTemplate.tag.description",
    //     steps: [
    //         {
    //             id: "0",
    //             operator: "@trigger/security-policy",
    //             parameters: {
    //                 fields: [
    //                     {
    //                         key: "rgXedKgdfEjmgHRs",
    //                         type: "asTags",
    //                         name: "文档标签",
    //                         required: true,
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "1",
    //             operator: "@anyshare/doc/addtag",
    //             parameters: {
    //                 docid: "{{__0.source.id}}",
    //                 tags: "{{__0.fields.rgXedKgdfEjmgHRs}}",
    //             },
    //         },
    //     ],
    // },
    // {
    //     key: "level",
    //     title: "uploadTemplate.level",
    //     description: "uploadTemplate.level.description",
    //     steps: [
    //         {
    //             id: "0",
    //             operator: "@trigger/security-policy",
    //             parameters: {
    //                 fields: [
    //                     {
    //                         key: "rgXedKgdfEjmgHRs",
    //                         type: "asLevel",
    //                         name: "文档密级",
    //                         required: true,
    //                     },
    //                 ],
    //             },
    //         },
    //         {
    //             id: "1",
    //             operator: "@anyshare/doc/setcsflevel",
    //             parameters: {
    //                 docid: "{{__0.source.id}}",
    //                 csf_level: "{{__0.fields.rgXedKgdfEjmgHRs}}",
    //             },
    //         },
    //     ],
    // },
    {
        key: "complete",
        title: "uploadTemplate.complete",
        description: "uploadTemplate.complete.description",
        steps: [
            {
                id: "0",
                operator: "@trigger/security-policy",
                parameters: {
                    fields: [
                        {
                            key: "BvzqeKrLqCVsYgRt",
                            type: "asTags",
                            name: "文档标签",
                            required: true,
                        },
                        {
                            key: "xcYEsLeQITAsBVhb",
                            type: "asMetadata",
                            name: "文档编目",
                            required: true,
                        },
                        {
                            key: "ydJYtDUOmGqiexLU",
                            type: "asAccessorPerms",
                            name: "文档权限",
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
                            type: "asTags",
                            title: "标签",
                            value: "{{__0.fields.BvzqeKrLqCVsYgRt}}",
                        },
                        {
                            type: "asMetadata",
                            title: "编目",
                            value: "{{__0.fields.xcYEsLeQITAsBVhb}}",
                        },
                        {
                            type: "asAccessorPerms",
                            title: "访问权限",
                            value: "{{__0.fields.ydJYtDUOmGqiexLU}}",
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
                                id: "10",
                                operator: "@anyshare/doc/addtag",
                                parameters: {
                                    docid: "{{__0.source.id}}",
                                    tags: "{{__0.fields.BvzqeKrLqCVsYgRt}}",
                                },
                            },
                            {
                                id: "11",
                                operator: "@anyshare/doc/settemplate",
                                parameters: {
                                    docid: "{{__0.source.id}}",
                                    templates:
                                        "{{__0.fields.xcYEsLeQITAsBVhb}}",
                                },
                            },
                            {
                                id: "12",
                                operator: "@anyshare/doc/perm",
                                parameters: {
                                    docid: "{{__0.source.id}}",
                                    asAccessorPerms:
                                        "{{__0.fields.ydJYtDUOmGqiexLU}}",
                                    type: "asAccessorPerms",
                                },
                            },
                        ],
                    },
                    {
                        id: "5",
                        conditions: [
                            [
                                {
                                    id: "13",
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
                                    id: "14",
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
        ],
    },
    // 标密
    {
        key: "setLevel",
        title: "uploadTemplate.setLevel",
        description: "uploadTemplate.setLevel.description",
        steps: [
            {
                id: "0",
                operator: "@trigger/security-policy",
                parameters: {
                    fields: [
                        {
                            key: "dkZyuwKYgJiiHmWh",
                            type: "asLevel",
                            name: "文件密级",
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
                            title: "上传文件",
                            value: "{{__0.source.id}}",
                        },
                        {
                            type: "asLevel",
                            title: "文件密级",
                            value: "{{__0.fields.dkZyuwKYgJiiHmWh}}",
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
                                    id: "4",
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
                                id: "5",
                                operator: "@internal/tool/py3",
                                parameters: {
                                    input_params: [
                                        {
                                            id: "1r2ny",
                                            key: "file",
                                            type: "string",
                                            value: "{{__0.source.id}}",
                                        },
                                        {
                                            id: "3wpbj",
                                            key: "csflevel",
                                            type: "object",
                                            value: "{{__0.fields.dkZyuwKYgJiiHmWh}}",
                                        },
                                        {
                                            id: "6yare",
                                            key: "version",
                                            type: "string",
                                            value: "{{__0.source.rev}}",
                                        },
                                    ],
                                    output_params: [],
                                    code: "import json\nimport time\nimport requests\nfrom aishu_anyshare_api.api_client import ApiClient\n\ndef main(file, csflevel, version):\n    if 'csflevel' not in csflevel:\n        return\n    content = get_doc_size(doc_id=file)\n    content_obj = b''\n    try:\n        content_obj = json.loads(content)\n    except Exception as e:\n        raise Exception(\"parse doc size info result failed, content: {}, detail: {}\".format(str(content), str(e)))\n    if 'dirnum' in content_obj and content_obj['dirnum'] == 0:\n        set_file_encrypt_info(file=file, csflevel=csflevel, version=version)\n    if 'dirnum' in content_obj and content_obj['dirnum'] != 0:\n        files = get_all_files(doc_id=file)\n        for val in files:\n            set_file_encrypt_info(file=val['docid'], csflevel=csflevel, version=val['rev'])\n    if 'code' in content_obj:\n        raise Exception(content_obj['cause'])\n\n\ndef set_file_encrypt_info(file, csflevel, version):\n    doc_id = file.split(\"/\")[-1]\n    csf_level = csflevel['csflevel']\n    content_obj = cycle_get_encrypt_info(doc_id=doc_id, version=version)\n    encrypted, origin_csf_level = False, -1\n    if \"encrypted\" in content_obj and \"csf_level\" in content_obj:\n        encrypted, origin_csf_level = content_obj['encrypted'], content_obj['csf_level']\n    if not encrypted or csf_level > origin_csf_level:\n        cycle_file_encrypt(doc_id=doc_id, csf_level=csf_level, version=version)\n    set_csf_level(doc_id=file, csf_level= csf_level)\n    if 'csfinfo' in csflevel:\n        csf_info = csflevel['csfinfo']\n        set_csf_info(doc_id=file, scope=csf_info['scope'], screason=csf_info['screason'], secrecyperiod=str(csf_info['secrecyperiod']))\n\ndef cycle_file_encrypt(doc_id: str, csf_level: int, version: str):\n    while True:\n        content = file_encrypt(doc_id=doc_id, csf_level=csf_level, version=version)\n        content_obj = b''\n        try:\n            content_obj = json.loads(content)\n        except Exception as e:\n            raise Exception(\"parse file_encrypt result failed, content: {}, detail: {}\".format(str(content), str(e)))\n        if  'status' not in content_obj:\n            raise Exception(\"file_encrypt result not contain status, detail : {}\".format(str(content_obj)))\n        if content_obj['status'] == 'completed':\n            return content_obj\n        elif content_obj['status'] == 'processing':\n            time.sleep(1)\n            continue\n        else:\n            raise Exception(content_obj['err_msg'])\n\ndef cycle_get_encrypt_info(doc_id: str, version: str):\n    while True:\n        content = get_encrypt_info(doc_id=doc_id, version=version)\n        content_obj = b''\n        try:\n            content_obj = json.loads(content)\n        except Exception as e:\n            raise Exception(\"parse get_encrypt_info result failed, content: {}, detail: {}\".format(str(content_obj)))\n        if  'status' not in content_obj:\n            raise Exception(\"get_encrypt_info result not contain status, detail : {}\".format(str(content_obj)))\n        if content_obj['status'] == 'processing':\n            time.sleep(1)\n            continue\n        elif content_obj['status'] == 'completed':\n            return content_obj\n        else:\n            raise Exception(content_obj['err_msg'])\n\ndef file_encrypt(doc_id: str, csf_level: int, version: str):\n    url = \"{}/api/docset/v1/file-encrypt\".format(ApiClient.get_global_host())\n    payload = json.dumps({\"doc_id\": doc_id, \"version\": version, \"csf_level\": csf_level})\n    headers = {'Content-Type': 'application/json','Authorization': 'Bearer {}'.format(ApiClient.get_global_access_token())}\n    resp = requests.request(method=\"POST\", url= url, headers=headers, data=payload, verify=False)\n    return resp.content\n\ndef get_encrypt_info(doc_id: str, version: str):\n    url = \"{}/api/docset/v1/subdoc\".format(ApiClient.get_global_host())\n    payload = json.dumps({\"doc_id\": doc_id, \"version\": version, \"type\": \"encryption_info\", \"format\": \"content\"})\n    headers = {'Content-Type': 'application/json','Authorization': 'Bearer {}'.format(ApiClient.get_global_access_token())}\n    resp = requests.request(method=\"POST\", url= url, headers=headers, data=payload, verify=False)\n    return resp.content\n\ndef set_csf_info(doc_id: str, scope: str, screason: str, secrecyperiod: str):\n    url = \"{}/api/efast/v1/file/setcsfinfo\".format(ApiClient.get_global_host())\n    payload = json.dumps({\"docid\": doc_id, \"csfinfo\": {\"scope\": scope, \"screason\": screason, \"secrecyperiod\": secrecyperiod}})\n    headers = {'Content-Type': 'application/json','Authorization': 'Bearer {}'.format(ApiClient.get_global_access_token())}\n    resp = requests.request(method=\"POST\", url= url, headers=headers, data=payload, verify=False)\n    if resp.status_code != requests.codes.ok:\n        raise Exception(resp.text)\n\ndef set_csf_level(doc_id: str, csf_level: int):\n    url = \"{}/api/efast/v1/file/setcsflevel\".format(ApiClient.get_global_host())\n    payload = json.dumps({\"docid\": doc_id, \"csflevel\": csf_level})\n    headers = {'Content-Type': 'application/json','Authorization': 'Bearer {}'.format(ApiClient.get_global_access_token())}\n    resp = requests.request(method=\"POST\", url= url, headers=headers, data=payload, verify=False)\n    if resp.status_code != requests.codes.ok:\n        raise Exception(resp.text)\n\ndef list_dir(doc_id: str):\n    url = \"{}/api/efast/v1/dir/list\".format(ApiClient.get_global_host())\n    payload = json.dumps({\"docid\": doc_id,\"sort\": \"asc\",\"by\": \"name\"})\n    headers = {'Content-Type': 'application/json','Authorization': 'Bearer {}'.format(ApiClient.get_global_access_token())}\n    resp = requests.request(method=\"POST\", url= url, headers=headers, data=payload, verify=False)\n    return resp.content\n\ndef get_all_files(doc_id: str):\n    files = []\n    stack = [doc_id]\n    while stack:\n        current = stack.pop()\n        content = list_dir(doc_id=current)\n        try:\n            content_obj = json.loads(content)\n            if 'dirs' in content_obj:\n                for dir in content_obj['dirs']:\n                    stack.append(dir['docid'])\n            if 'files' in content_obj:\n                files.extend(content_obj['files'])\n            if 'code' in content_obj:\n                raise Exception(content_obj['cause'])\n        except Exception as e:\n            raise Exception(\"parse list dir result failed, content: {}, detail: {}\".format(str(content), str(e)))\n    return files\n\ndef get_doc_size(doc_id: str):\n    url = \"{}/api/efast/v1/dir/size\".format(ApiClient.get_global_host())\n    payload = json.dumps({\"docid\": doc_id})\n    headers = {'Content-Type': 'application/json','Authorization': 'Bearer {}'.format(ApiClient.get_global_access_token())}\n    resp = requests.request(method=\"POST\", url= url, headers=headers, data=payload, verify=False)\n    return resp.content",
                                },
                            },
                        ],
                    },
                    {
                        id: "7",
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
                        steps: [
                            {
                                id: "9",
                                operator: "@internal/return",
                                parameters: {
                                    result: "failed",
                                },
                            },
                        ],
                    },
                    {
                        id: "12",
                        conditions: [
                            [
                                {
                                    id: "10",
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
                                id: "11",
                                operator: "@internal/return",
                                parameters: {
                                    result: "failed",
                                },
                            },
                        ],
                    },
                ],
            },
        ],
        is_security_level: true,
    },
];
