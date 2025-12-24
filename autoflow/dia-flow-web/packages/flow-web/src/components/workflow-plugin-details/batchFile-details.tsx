import { MicroAppContext } from "@applet/common";
import { useTranslate, API } from "@applet/common";
import { Button, Drawer, Dropdown, Menu, Modal, Table, Typography } from "antd";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import styles from "./styles/batchFile-details.module.less";
import {
    CloseOutlined,
    DownloadOutlined,
    OpenInNewTabOutlined,
    OpenOutlined,
    OpenlocationOutlined,
    OperationOutlined,
    UpArrowOutlined,
} from "@applet/icons";
import clsx from "clsx";
import {
    AuditPageTarget,
    WorkflowAuditStatus,
    WorkflowContext,
} from "../workflow-provider";
import { Thumbnail } from "../thumbnail";
import { useDownloadInfo, useHandleErrReq } from "../../utils/hooks";
import empty from "../../assets/empty.png";
import { isArray } from "lodash";
import { efast } from "@applet/api";
import { BreadCrumbs } from "./bread-crumbs";
// @ts-ignore
import { apis, components } from "@dip/components";

export interface BatchFileDetailsProps {
    docids: string | string[];
    isDirectory: boolean;
}

export interface DocItem {
    docid: string;
    name: string;
    path: string;
    isDirectory: boolean;
}

export function BatchFileDetails({
    docids,
    isDirectory,
}: BatchFileDetailsProps) {
    const t = useTranslate();
    const [root, setRoot] = useState<DocItem[]>();
    const [isShowModal, setShowModal] = useState(false);
    const { microWidgetProps } = useContext(MicroAppContext);
    const { target } = useContext(WorkflowContext);
    const docLibsCache = useRef<Promise<efast.ClassifiedEntryDoc[]>>();
    const isSecretCache = useRef<boolean | undefined>(undefined);
    const handleErr = useHandleErrReq();

    async function getFilePathById(id: string) {
        if (!docLibsCache.current) {
            docLibsCache.current = API.efast
                .efastV1ClassifiedEntryDocLibsGet()
                .then(({ data }) => data);
        }

        const libs = await docLibsCache.current;

        const { data } = await API.efast.efastV1FileConvertpathPost({
            docid: id,
        });
        let path = data.namepath;

        for (const lib of libs) {
            if (
                lib.doc_libs &&
                lib.doc_libs.some((item) => id.startsWith(item.id))
            ) {
                // 涉密 共享文档库名称变更
                if (
                    lib.id === "shared_user_doc_lib" &&
                    typeof isSecretCache.current === "undefined"
                ) {
                    try {
                        const { data } =
                            await API.appStore.apiAppstoreV1SecretConfigGet();
                        isSecretCache.current = data?.is_security_level;
                    } catch (error) {
                        isSecretCache.current = true;
                    }
                }

                if (
                    lib.id === "shared_user_doc_lib" &&
                    isSecretCache.current === true
                ) {
                    path = `${t("shared_user_doc_lib.secret", lib.name)}/${data.namepath
                        }`;
                    break;
                } else {
                    // 顶级文档库国际化处理（我的/共享/部门/知识库）
                    path = `${t(lib.id, lib.name)}/${data.namepath}`;
                }

                if (lib.subtypes) {
                    for (const subtype of lib.subtypes) {
                        if (
                            (
                                subtype.doc_libs as unknown as efast.EntryDoc[]
                            ).some((item) => id.startsWith(item.id))
                        ) {
                            // 自定义文档库
                            path = `${subtype.name}/${data.namepath}`;
                            break;
                        }
                    }
                }
            }
        }

        return path;
    }

    const onClick = useCallback(async () => {
        if (target === AuditPageTarget.donePage) {
            microWidgetProps?.components?.messageBox({
                type: "info",
                title: t("err.title.donepage", "此申请已结束，无法查看。"),
                okText: t("ok"),
            });
            return;
        }
        let ids = docids;
        if (!isArray(ids)) {
            ids = [ids].filter(Boolean);
        }
        const fileArr: DocItem[] = [];
        const errorArr: any[] = [];
        let index = 0;
        const callback = () => {
            if (fileArr.length) {
                setRoot(fileArr);
                setShowModal(true);
            } else {
                // 文件目录不存在
                if (errorArr[0]?.data.code === 404002006) {
                    microWidgetProps?.components?.messageBox({
                        type: "info",
                        title: t("err.operation.title", "无法执行此操作"),
                        message: t(
                            "err.404002006",
                            "当前文档已不存在或其路径发生变更。"
                        ),
                        okText: t("ok"),
                    });
                    return;
                }
                handleErr({ error: errorArr[0] });
            }
        };
        ids.forEach(async (id) => {
            try {
                // 大量数据分批
                if (index > 100) {
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(true);
                        }, 50 * Math.floor(index / 100));
                    });
                }
                const path = await getFilePathById(id);

                const names = path.split("/");

                const file: DocItem = {
                    docid: id,
                    name: names.pop()!,
                    path,
                    isDirectory,
                };
                fileArr.push(file);
            } catch (error: any) {
                console.error(error);
                errorArr.push(error.response);
            } finally {
                ++index;
                if (index === ids.length) {
                    callback();
                }
            }
        });
    }, [docids, isDirectory]);

    return (
        <>
            <Button type="link" onClick={onClick}>
                {t("viewDetails", "查看详情")}
            </Button>
            <Modal
                width={700}
                title={t("viewDetails", "查看详情")}
                open={isShowModal}
                mask
                centered
                transitionName=""
                onCancel={() => {
                    setRoot(undefined);
                    setShowModal(false);
                }}
                destroyOnClose
                footer={null}
                className={styles.modal}
                closeIcon={<CloseOutlined style={{ fontSize: "13px" }} />}
            >
                <WorkflowPluginFileDetailsContent
                    root={root}
                    key={JSON.stringify(docids)}
                />
            </Modal>
        </>
    );
}

interface WorkflowPluginFileDetailsContentProps {
    root?: DocItem[];
}

function WorkflowPluginFileDetailsContent({
    root,
}: WorkflowPluginFileDetailsContentProps) {
    const { microWidgetProps, functionId, prefixUrl } = useContext(MicroAppContext);
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const t = useTranslate();
    const [breadcrumbs, setBreadcrumbs] = useState<DocItem[]>([
        {
            docid: "",
            name: t("allFiles", "全部文档"),
            isDirectory: true,
            path: "---",
        },
    ]);
    const popupContainer = useRef<HTMLDivElement>(null);
    const { audit_status, target } = useContext(WorkflowContext);
    const currentDir = breadcrumbs.at(-1);
    const currentDirId = currentDir?.docid;
    const [selectData, setSelectData] = useState<DocItem[]>([]);
    const downloadAllInfo = useDownloadInfo();
    const handleErr = useHandleErrReq();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [openView, setOpenView] = useState(false)

    const enablePreview = useMemo(() => {
        if (
            target === AuditPageTarget.donePage ||
            (audit_status !== WorkflowAuditStatus.Pending && target !== AuditPageTarget.applyPage)
        ) {
            return false;
        }
        return true;
    }, []);

    const back = () => {
        if (breadcrumbs.length === 1) {
            return;
        }
        setBreadcrumbs((breadcrumbs) => breadcrumbs.slice(0, -1));
    };

    const { data, isValidating } = useSWR(
        ["WorkflowPluginFileDetailsContentGetItems", currentDirId],
        async () => {
            if (currentDirId) {
                try {
                    const { data } = await API.efast.efastV1DirListPost({
                        docid: currentDirId,
                        sort: "asc",
                        by: "name",
                    });

                    const path = `${currentDir.path}/${currentDir.name}`;

                    return [...data.dirs, ...data.files].map(
                        ({ name, docid, size }) => ({
                            name,
                            docid,
                            isDirectory: size === -1,
                            path,
                        })
                    );
                } catch (error: any) {
                    // 文件目录不存在
                    if (error?.response?.data.code === 404002006) {
                        microWidgetProps?.components?.messageBox({
                            type: "info",
                            title: t("err.operation.title", "无法执行此操作"),
                            message: t(
                                "err.404002006",
                                "当前文档已不存在或其路径发生变更。"
                            ),
                            okText: t("ok"),
                            onOk: back,
                        });
                        return [];
                    }
                    // 权限不够
                    if (error?.response?.data.code === 403001002) {
                        microWidgetProps?.components?.messageBox({
                            type: "info",
                            title: t("err.operation.title", "无法执行此操作"),
                            message: t(
                                "err.preview.permission.folder",
                                "您对该文件夹没有预览权限。"
                            ),
                            okText: t("ok"),
                            onOk: back,
                        });
                        return [];
                    }
                    // 密级不足
                    if (
                        error?.response?.data.code === 403002065 ||
                        error?.response?.data.code === 403001108
                    ) {
                        microWidgetProps?.components?.messageBox({
                            type: "info",
                            title: t("err.operation.title", "无法执行此操作"),
                            message: t(
                                "err.submit.securityLevel.folder",
                                "您对该文件夹密级权限不足。"
                            ),
                            okText: t("ok"),
                            onOk: back,
                        });
                        return [];
                    }
                    return [];
                } finally {
                    setSelectedRowKeys([]);
                }
            } else {
                return root;
            }
        },
        {
            dedupingInterval: 0,
        }
    );

    const onSelectChange = (
        newSelectedRowKeys: React.Key[],
        selectedRows: DocItem[]
    ) => {
        setSelectedRowKeys(newSelectedRowKeys as string[]);
        setSelectData(selectedRows);
    };

    const getMenu = (item: DocItem) => (
        <Menu>
            <Menu.Item
                key="open"
                icon={
                    item.isDirectory ? (
                        <OpenOutlined style={{ fontSize: "16px" }} />
                    ) : (
                        <OpenInNewTabOutlined style={{ fontSize: "16px" }} />
                    )
                }
                onClick={() => openItem(item)}
            >
                {t("open", "打开")}
            </Menu.Item>
            <Menu.Item
                key="download"
                icon={<DownloadOutlined style={{ fontSize: "16px" }} />}
                onClick={() => downloadItem(item)}
            >
                {t("download", "下载")}
            </Menu.Item>
            {/* <Menu.Item
                key="location"
                icon={<OpenlocationOutlined style={{ fontSize: "16px" }} />}
                onClick={() => handleOpenLocation(item)}
            >
                {t("operation.location", "打开所在位置")}
            </Menu.Item> */}
        </Menu>
    );

    const openItem = (item: DocItem) => {
      if (!enablePreview) {
        return;
      }
      if (item.isDirectory) {
        setBreadcrumbs((breadcrumbs) => [...breadcrumbs, item]);
        setSelectedRowKeys([]);
      } else {
        setOpenView(true);
        setTimeout(() => {
          apis.mountComponent(
            components.Preview,
            {
              file: {
                objectId: item.docid?.split("/")?.pop(),
                name: item.name,
              },
            },
            containerRef.current
          );
        }, 0);
        // microWidgetProps?.contextMenu?.previewFn({
        //     functionid: functionId,
        //     item: {
        //         docid: item.docid,
        //         size: 1,
        //         name: item.name,
        //     },
        // });
      }
    };

    const downloadItem = async (item: DocItem) => {
      if (!enablePreview) {
        return;
      }

      try {
        const { data } = await API.axios.post(
          `${prefixUrl}/api/efast/v1/file/osdownload`,
          {
            authtype: "QUERY_STRING",
            docid: item.docid,
            rev: "",
            savename: item.name,
            usehttps: true,
          }
        );
        const url = data?.authrequest[1];
        const link = document.createElement("a");
        link.href = url;
        link.download = item.name;
        link.click();
      } catch (error: any) {
        handleErr({ error: error?.response });
      }

      // microWidgetProps?.contextMenu?.downloadFn({
      //     item: {
      //         docid: item.docid,
      //         size: item.isDirectory ? -1 : 1,
      //         name: item.name,
      //     },
      // });
    };

    const handleOpenLocation = (item: DocItem) => {
        if (!enablePreview) {
            return;
        }
        microWidgetProps?.contextMenu?.openLocationFn({
            functionid: functionId,
            item: {
                docid: item.docid,
                size: item.isDirectory ? -1 : 1,
                name: item.name,
            },
            isForceNewTab: true,
        });
    };

    const handleBatchDownload = async () => {
        if (!enablePreview) {
            return;
        }
        if (selectedRowKeys.length === 1) {
            downloadItem(selectData[0]);
            return;
        }
        const ids = selectedRowKeys.map((item: string) => ({
            id: item.slice(-32),
        }));
        const saveAs = selectData[0].name + ".zip";
        try {
            const {
                data: { package_address, items: downloadDocs },
                config,
            } = await API.openDoc.apiOpenDocV1FileDownloadPost({
                name: saveAs || "files.zip",
                doc: ids,
            });

            if (package_address) {
                const token = (config.headers?.authorization as string).slice(
                    7
                );
                const url = `${package_address}?token=${token}`;

                if (
                    microWidgetProps?.config.systemInfo?.isInElectronTab ||
                    microWidgetProps?.config.systemInfo?.platform === "electron"
                ) {
                    (microWidgetProps.contextMenu?.downloadWithUrl as any)({
                        functionid: functionId,
                        url,
                        downloadName: saveAs || "files.zip",
                    });
                } else {
                    const a = document.createElement("a");
                    a.href = url;
                    a.target = "_blank";
                    a.download = saveAs || `files.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } else {
                downloadAllInfo(
                    downloadDocs as any,
                    selectData.map((i) => ({
                        ...i,
                        id: i.docid,
                        size: i.isDirectory ? -1 : 1,
                    }))
                );
            }
        } catch (e: any) {
            handleErr({ error: e?.response });
        }
        microWidgetProps?.components?.toast.info(
            t("taskFiles.downloadLoading", "下载准备中...")
        );
    };

    const handleClickCrumbs = (item: DocItem) => {
        const newArr = [];
        for (let i = 0; i < breadcrumbs.length; i += 1) {
            if (breadcrumbs[i].docid !== item.docid) {
                newArr.push(breadcrumbs[i]);
            } else {
                newArr.push(breadcrumbs[i]);
                setBreadcrumbs(newArr);
                break;
            }
        }
    };

    return (
      <div className={styles.container}>
        <Button
          type="primary"
          className={clsx(
            styles["download-btn"],
            {
              [styles["visible"]]:
                selectedRowKeys.length > 0 && enablePreview && !isValidating,
            },
            "automate-oem-primary-btn"
          )}
          icon={<DownloadOutlined style={{ fontSize: "16px" }} />}
          onClick={handleBatchDownload}
        >
          {t("download", "下载")}
        </Button>
        {/* 面包屑导航 */}
        <div className={styles["nav-bar"]}>
          <span
            className={clsx(styles["back-btn"], {
              [styles["back-link"]]: breadcrumbs.length > 1,
            })}
            onClick={back}
          >
            <UpArrowOutlined style={{ fontSize: "16px", height: "18px" }} />
          </span>
          <BreadCrumbs value={breadcrumbs} onChange={handleClickCrumbs} />
        </div>
        <Table
          dataSource={data}
          rowKey={(item) => item.docid}
          loading={isValidating}
          pagination={false}
          className={styles.fileTable}
          bordered={false}
          showSorterTooltip={false}
          scroll={{
            y: 300,
          }}
          rowSelection={{
            selectedRowKeys,
            type: "checkbox",
            onChange: onSelectChange,
          }}
          locale={
            isValidating
              ? { emptyText: <div></div> }
              : {
                  emptyText: (
                    <div className={styles["empty-container"]}>
                      <div className={styles["img-wrapper"]}>
                        <img src={empty} className={styles["img"]} alt="" />
                      </div>
                      <span className={styles["tip"]}>
                        {t("empty", "列表为空")}
                      </span>
                    </div>
                  ),
                }
          }
          onRow={(item: DocItem) => {
            return {
              onClick: () => {
                setSelectedRowKeys([item.docid]);
                setSelectData([item]);
              },
              onDoubleClick: () => {
                openItem(item);
              },
            };
          }}
        >
          <Table.Column
            title={t("filename", "文档名称")}
            key="name"
            dataIndex="name"
            render={(name, item: DocItem) => {
              return (
                <div className={styles["name-wrapper"]}>
                  <span onClick={() => enablePreview && openItem(item)}>
                    <Thumbnail
                      doc={{
                        ...item,
                        size: item.isDirectory ? -1 : 1,
                      }}
                      className={styles["doc-icon"]}
                    />
                  </span>

                  <Typography.Text
                    ellipsis
                    title={name}
                    className={clsx({
                      [styles["doc-link"]]: enablePreview,
                    })}
                    onClick={() => enablePreview && openItem(item)}
                  >
                    {name}
                  </Typography.Text>
                </div>
              );
            }}
          ></Table.Column>
          {enablePreview && (
            <Table.Column
              key="actions"
              title={t("actions", "操作")}
              width="98px"
              render={(item: DocItem) => {
                return (
                  <Dropdown
                    overlay={getMenu(item)}
                    trigger={["click"]}
                    transitionName=""
                    overlayClassName={styles["operation-pop"]}
                    getPopupContainer={() =>
                      document.querySelector("." + styles["fileTable"]) ||
                      document.body
                    }
                  >
                    <Button
                      size="small"
                      className={styles["ops-btn"]}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <OperationOutlined
                        style={{
                          fontSize: "16px",
                          height: "16px",
                        }}
                      />
                    </Button>
                  </Dropdown>
                );
              }}
            ></Table.Column>
          )}
          <Table.Column
            key="path"
            width="45%"
            title={t("path", "所在位置")}
            dataIndex="path"
            render={(path, item: DocItem) => {
              return (
                <Typography.Text
                  ellipsis
                  title={path}
                  className={clsx({
                    [styles["doc-link"]]: enablePreview,
                  })}
                  onClick={() => enablePreview && handleOpenLocation(item)}
                >
                  {path}
                </Typography.Text>
              );
            }}
          ></Table.Column>
        </Table>
        <div ref={popupContainer}></div>
        <Drawer
          title="文档预览"
          placement="right"
          onClose={()=>{setOpenView(false)}}
          open={openView}
          width={'100%'}
        >
          <div ref={containerRef} />
        </Drawer>
      </div>
    );
}
