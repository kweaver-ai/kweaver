import { Button, Typography } from 'antd';
import { useTranslate } from '@applet/common';
import { CloseOutlined, PlusOutlined } from '@applet/icons';
import { VirtualTable } from '../virtual-table/virtual-table';
import styles from './as-file-select.module.less';
import { getDocLibIcon } from '../data-studio/trigger-config/select-doclib/helper';
import { includes } from 'lodash';

export interface DocLibItem {
    id?: string,
    docid: string,
    path: string,
    doc_lib_type: string
}

interface DocLibListProps {
    data: DocLibItem[];
    onAdd(): void;
    onChange(value: DocLibItem[]): void;
}

// 特殊部门文档库id
const specialDocLib = [
    "department_doc_lib",
    "custom_doc_lib",
    "knowledge_doc_lib"
]

export const DocLibList = ({
    data,
    onAdd,
    onChange,
}: DocLibListProps) => {
    const t = useTranslate();

    const handleDelete = (id: string) => {
        const newData = data
            ?.filter((item) => item.docid !== id)
        onChange(newData);
    };

    const columns: any = [
        {
            dataIndex: 'path',
            render: (name: string, record: any) => {
                const { docid } = record

                return (
                    <div className={styles['doc-name-wrapper']}>
                        <img className={styles['lib-icon']} src={getDocLibIcon(record.doc_lib_type)} alt='' />

                        <Typography.Text
                            ellipsis
                            className={styles['doc-name']}
                            title={name}
                        >
                            {
                                includes(specialDocLib, docid)
                                    ? t(`datastudio.${docid}`)
                                    : name
                            }
                        </Typography.Text>
                    </div>
                )
            },
        },
        {
            dataIndex: 'docid',
            width: 32,
            render: (id: string) => (
                <CloseOutlined
                    title={t('delete', '删除')}
                    className={styles['delete-icon']}
                    onClick={() => {
                        handleDelete(id);
                    }}
                />
            ),
        },
    ];

    return (
        <div className={styles['list-container']}>
            <VirtualTable
                columns={columns}
                bordered={false}
                dataSource={data}
                rowKey='id'
                scroll={{
                    y: data?.length < 5 ? data.length * 50 : 250,
                }}
                showHeader={false}
                className={styles['table-list']}
                locale={{
                    emptyText: <div />,
                }}
            />
            <Button type='link' icon={<PlusOutlined />} onClick={() => onAdd()}>
                {t("datastudio.trigger.scope.addMore", "添加更多文档库")}
            </Button>
        </div>
    );
};
