import { API } from "@applet/common";
import { IDocItem } from "../as-file-preview";
import { AxiosRequestConfig } from "axios";

interface FileSearchItem {
    basename: string;
    content: string | null;
    created_at: number;
    created_by: string;
    doc_id: string;
    doc_lib_type: string;
    doc_type: string[];
    extension: string;
    highlight: {
        basename: string[];
    };
    modified_at: number;
    modified_by: string;
    only_display: boolean;
    parent_path: string;
    score: number;
    security_level: number;
    size: number;
    source: string;
    summary: string;
    tags: any[];
    title: any[];
}

interface Condition {
    created_by: object;
    extension: object;
    modified_by: object;
    tags: object;
}

interface SimilarDocs {
    [index: number]: string[];
}

interface SearchResponse {
    condition: Condition;
    files: FileSearchItem[];
    hits: number;
    next: number;
    similar_docs: SimilarDocs[];
}

export async function searchDocuments(names: string[], range: string[] = [], limit = 20, config?: AxiosRequestConfig): Promise<IDocItem[]> {
    try {
        const { data } = await API.axios.post<SearchResponse>(`/api/ecosearch/v1/file-search`, {
            delimiter: ",",
            model: "phrase",
            dimension: ["basename"],
            keyword: names.join(","),
            range,
            quick_search: true,
            rows: limit,
            start: 0,
            type: "doc",
        }, config);

        return data.files.map((item) => ({
            docid: item.doc_id,
            size: item.size,
            name: item.basename + item.extension,
            type: item.size === -1 ? "folder" : "file",
        }));
    } catch (e) {
        return [];
    }
}

export async function searchAccessors(names: string[], config?: AxiosRequestConfig) {
    const results = await Promise.allSettled(
        names.map((name) =>
            API.efast.eacpV1DepartmentSearchPost({
                key: name,
            }, config)
        )
    );

    const items: any[] = [];

    for (const result of results) {
        if (result.status === "fulfilled") {
            const { data } = result.value;
            for (const dep of data.depinfos) {
                items.push({
                    type: "department",
                    name: dep.name,
                    id: dep.depid,
                });
            }

            for (const user of data.userinfos) {
                items.push({
                    type: "user",
                    name: user.name,
                    id: user.userid,
                });
            }
        }
    }

    return items;
}
