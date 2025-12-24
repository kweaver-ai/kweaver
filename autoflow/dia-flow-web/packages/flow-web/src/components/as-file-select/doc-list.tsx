import { Button, Typography } from "antd";
import { useTranslate } from "@applet/common";
import { CloseOutlined, PlusOutlined } from "@applet/icons";
import { getFileIcon } from "../../utils/file";
import { DocItem } from "./as-file-select";
import { VirtualTable } from "../virtual-table/virtual-table";
import styles from "./as-file-select.module.less";

interface DocListProps {
    data: DocItem[];
    selectType: 1 | 2 | 3;
    onAdd(): void;
    onChange(value?: string[]): void;
}

export const getDocIcon = (
    name: string,
    isFolder: boolean,
    className?: string
) => {
    const Icon = getFileIcon(name, isFolder);
    return <Icon className={className} />;
};

export const DocList = ({
    data,
    selectType,
    onAdd,
    onChange,
}: DocListProps) => {
    const t = useTranslate();

    const handleDelete = (id: string) => {
        const newData = data
            ?.filter((item) => item.id !== id)
            .map((item) => item.id);
        onChange(newData);
    };

    const columns: any = [
        {
            dataIndex: "path",
            render: (path: string, record: DocItem) => (
                <div className={styles["doc-name-wrapper"]}>
                    {getDocIcon(
                        record.name,
                        selectType === 2
                            ? true
                            : selectType === 1
                            ? false
                            : record.size === -1,
                        styles["doc-icon"]
                    )}

                    <Typography.Text
                        ellipsis
                        className={styles["doc-name"]}
                        title={path}
                    >
                        {path}
                    </Typography.Text>
                </div>
            ),
        },
        {
            dataIndex: "id",
            width: 32,
            render: (id: string) => (
                <CloseOutlined
                    title={t("delete", "删除")}
                    className={styles["delete-icon"]}
                    onClick={() => {
                        handleDelete(id);
                    }}
                />
            ),
        },
    ];

    return (
        <div className={styles["list-container"]}>
            <VirtualTable
                columns={columns}
                bordered={false}
                dataSource={data}
                rowKey="id"
                scroll={{
                    y: data?.length < 5 ? data.length * 50 : 250,
                }}
                showHeader={false}
                className={styles["table-list"]}
                locale={{
                    emptyText: <div />,
                }}
            />
            <Button type="link" icon={<PlusOutlined />} onClick={() => onAdd()}>
                {selectType === 3
                    ? t("addMore", "添加更多")
                    : selectType === 2
                    ? t("addMore.folder", "添加更多文件夹")
                    : t("addMore.file", "添加更多文件")}
            </Button>
        </div>
    );
};
