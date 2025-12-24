import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import type { UploadProps } from 'antd';
import { Button, List, Modal, PageHeader, Spin, Tooltip, Typography, Upload } from 'antd';
import { API, MicroAppContext, useTranslate } from '@applet/common';
import { ExclamationCircleOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { getBackUrl } from "../../components/header-bar";
import { Empty, LoadStatus } from "../../components/table-empty";
import headerStyles from "../../components/header-bar/styles/header-bar.module.less";
import { PackageCard } from '../../components/package-card';
import { useHandleErrReq } from '../../utils/hooks';
import styles from './python-packages.module.less'

export interface PackageInfo {
    id: string;
    name: string;
    oss_id: string;
    oss_key: string;
    created_at: number;
    creator_name: string,
}

const { confirm } = Modal;

function PythonPackages(): JSX.Element {
    const t = useTranslate();
    const handleErr = useHandleErrReq();
    const navigate = useNavigate()
    const [params] = useSearchParams();
    const from = params.get("back") || "";

    const { container, prefixUrl, microWidgetProps } = useContext(MicroAppContext);

    const [packageList, setPackageList] = useState<PackageInfo[]>([]);
    const [uploading, setUploading] = useState<boolean>(false)

    const uploadingRequest = useRef<AbortController | null>()

    const getPackageList = useCallback(() => {
        API.axios.get(`${prefixUrl}/api/coderunner/v1/py-packages`).then((res) => {
            setPackageList(res.data.pkgs)
        })
    }, [prefixUrl])

    const uploadProps: UploadProps = useMemo(() => ({
        accept: ".tar",
        method: 'PUT',
        showUploadList: false,
        action: `${prefixUrl}/api/coderunner/v1/py-package`,
        headers: { authorization: `Bearer ${microWidgetProps?.token?.getToken?.access_token}` },
        beforeUpload: (file) => {
            const isTooLarge = file.size > 2 * 1024 * 1024 * 1024; // 2GB

            if (isTooLarge) {
                microWidgetProps?.components?.toast?.info(
                    t("pythonPackage.sizeLimit.toast", "文件大小只支持2G以内")
                )
            }
            return !isTooLarge;
        },
        customRequest: (options) => {
            const controller = new AbortController();
            const { signal } = controller;

            uploadingRequest.current = controller

            const { action, file } = options;
            const formData = new FormData();
            formData.append('file', file);

            fetch(action, {
                method: 'PUT',
                body: formData,
                headers: options.headers,
                signal: signal,
            }).then(response => response.text())    // 响应体为空
                .then(text => text ? JSON.parse(text) : {})
                .then(json => {
                    if (json.code === 409000000) {
                        microWidgetProps?.components?.toast?.info(
                            t("pythonPackage.upload.exists", "已存在同名Python包，请重命名后再次上传")
                        );
                    } else if (json.code === 404000000) {
                        microWidgetProps?.components?.toast?.error(
                            t("pythonPackage.upload.noOSS", "对象存储服务无法连接，请联系管理员")
                        );
                    } else {
                        microWidgetProps?.components?.toast?.success(
                            t("pythonPackage.uploaded", "上传成功")
                        );

                        getPackageList();
                    }
                })
                .catch(err => {
                    console.log('upload-err', err);
                })
                .finally(() => {
                    setUploading(false);
                });
        },
        onChange(info) {
            const { file: { status } } = info;
            if (status === 'uploading') {
                setUploading(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [microWidgetProps, prefixUrl, getPackageList]);

    useEffect(() => {
        getPackageList()
    }, [getPackageList])

    return (
        <div className={styles['container']}>
            <PageHeader
                title={
                    <Typography.Text
                        ellipsis
                        title={t("pythonPackage", "Python包管理")}
                        className={headerStyles["title"]}
                    >
                        {t("pythonPackage", "Python包管理")}
                    </Typography.Text>
                }
                className={headerStyles["header"]}
                backIcon={
                    <LeftOutlined
                        className={headerStyles["back-icon"]}
                    />
                }
                onBack={() => navigate(getBackUrl('', from))}
            />
            <div className={styles['content']}>
                <div>{t("pythonPackage.installed", "已安装的Python包")}</div>
                <div>
                    <Tooltip
                        placement='right'
                        title={t("pythonPackage.sizeLimit", "要求tar格式，大小在2G以内")}
                    >
                        <Upload {...uploadProps}>
                            <Button
                                type='primary'
                                icon={<PlusOutlined />}
                                className={styles['upload-button']}
                            >
                                {t("pythonPackage.upload", "上传")}
                            </Button>
                        </Upload>
                    </Tooltip>
                </div>
                <div className={styles['package-list']}>
                    <List
                        grid={{
                            gutter: 24,
                            xs: 2,
                            sm: 2,
                            md: 2,
                            lg: 3,
                            xl: 3,
                            xxl: 4,
                        }}
                        dataSource={packageList}
                        locale={{
                            emptyText: (
                                <Empty
                                    height={window.innerHeight - 430}
                                    loadStatus={LoadStatus.Empty}
                                    emptyText={t("empty", "列表为空")}
                                />
                            ),
                        }}
                        renderItem={(item) => (
                            <List.Item>
                                <PackageCard
                                    key={item.id}
                                    packageInfo={item}
                                    onRequestDelete={handleDelete}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            </div>

            <Modal
                centered={true}
                open={uploading}
                width={420}
                footer={null}
                closable={false}
            >
                <div className={styles['uploading']}>
                    <Spin className={styles['uploading-spin']} />
                    <span>
                        {t("pythonPackage.uploading", "正在上传，请稍候")}
                    </span>
                </div>
                <div className={styles['uploading-footer']}>
                    <Button onClick={() => {
                        uploadingRequest.current?.abort();
                        uploadingRequest.current = null
                        setUploading(false)
                    }}>
                        {t("pythonPackage.upload.close", "关闭")}
                    </Button>
                </div>
            </Modal>
        </div >
    )

    async function handleDelete({ name, id }: { name: string, id: string }): Promise<void> {
        await confirm({
            centered: true,
            getContainer: () => container,
            title: t('pythonPackage.delete.title', '确定删除{packageName}吗？', { packageName: name }),
            icon: <ExclamationCircleOutlined />,
            content: t("pythonPackage.delete.desc", "删除后，使用此依赖包的工作流程将不可用"),
            onOk: async () => {
                try {
                    await API.axios.delete(`${prefixUrl}/api/coderunner/v1/py-packages/${id}`)

                    microWidgetProps?.components?.toast?.success(
                        t("delete.success", "删除成功")
                    );
                } catch (error: any) { handleErr({ error: error?.response }); }

                getPackageList()
            },
            onCancel() { },
        });
    }
}

export { PythonPackages }