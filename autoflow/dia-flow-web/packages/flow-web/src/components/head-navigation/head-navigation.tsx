import { FC, useContext, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
    Badge,
    Button,
    Carousel,
    Dropdown,
    Menu,
    Modal,
    Popover,
    Upload,
    UploadProps,
} from "antd";
import {
    AddOutlined,
    MinarrowDownOutlined,
    AuditColored,
    FlowsColored,
    ImportOutlined,
    AutomationTemplateColored,
    TriggerEventColored,
    TriggerManualColored,
    QuickGuideColored,
    GuideListColored,
    TriggerClockColored,
} from "@applet/icons";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useLocation, useNavigate } from "react-router";
import styles from "./head-navigation.module.less";
import useSWR from "swr";
import { isEmpty, isFunction } from "lodash";
import {
    TabFields,
    useCustomExecutorAccessible,
    useHandleErrReq,
    useTilterTabs,
} from "../../utils/hooks";
import { TemplateSelectModal } from "../template-select-modal";
import { ServiceConfigContext } from "../config-provider";
import guideImg from "../../assets/guide.png";

export const HeadNavigation: FC = () => {
    const { microWidgetProps, prefixUrl } = useContext(MicroAppContext);
    const t = useTranslate();
    const location = useLocation();
    const navigate = useNavigate();
    const [showGuide, setShowGuid] = useState(false);
    const [hasAudit, setHasAudit] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const { config, onChangeConfig } = useContext(ServiceConfigContext);
    const [showPopTip, setShowPopTip] = useState(false);
    const [hiddenSecondPage, setHiddenPage] = useState(true);
    const handleErr = useHandleErrReq();
    const pathName = location.pathname;

    const isChecked = (key: string) => {
        if (pathName === "/" && key === "/") {
            return true;
        }
        if (pathName === key) {
            return true;
        }
        if (key === "/nav/model" && pathName.startsWith(key)) {
            return true;
        }
        if (key === "/nav/list" && pathName === "/") {
            return true;
        }
        return false;
    };

    const navigateToMicro = (name: string) => {
        microWidgetProps?.history?.navigateToMicroWidget({
            name: 'workflow',
            // command: name,
            path: `/${name}?hidesidebar=true`,
            isNewTab: true,
        });
    };

    // 新建任务时判断数量是否超出50
    const handleCreateTask = async (key: string) => {
        try {
            if (key !== "import") {
              const data = await API.automation.dagsGet();
              if (data?.data?.total && data?.data?.total >= 50) {
                 modalInfo(
                   t("err.title.create", "无法新建自动任务"),
                   t(
                     "err.tasksExceeds",
                     "您新建的自动任务数已达上限。（最多允许新建50个）"
                   )
                 );
                return;
              }
            }

            switch (key) {
                case "new-event":
                    navigate(`/new?type=event&back=${btoa(location.pathname)}`);
                    break;
                case "new-manual":
                    navigate(
                        `/new?type=manual&back=${btoa(location.pathname)}`
                    );
                    break;
                // case "new-form":
                //     navigate(`/new?type=form&back=${btoa(location.pathname)}`);
                //     break;
                case "new-cron":
                    navigate(`/new?type=cron&back=${btoa(location.pathname)}`);
                    break;
                case "template":
                    setShowTemplateModal(true);
                    break;
                case "import":
                    break;
            }
        } catch (error: any) {
            if (
                error?.response?.data?.code ===
                "ContentAutomation.Forbidden.ServiceDisabled"
            ) {
                onChangeConfig({ ...config, isServiceOpen: false });
                modalInfo(
                   t("err.title.create", "无法新建自动任务"),
                   t("notEnable", "当前工作流未开启，请联系管理员")
                 );
                return;
            }
            handleErr({ error: error?.response });
        }
    };

    const modalInfo = (title?:string, content?:any) => {
      Modal.info({
        title,
        content,
        getContainer: microWidgetProps?.container,
        onOk() {},
      });
    };

    const uploadProps: UploadProps = {
        name: "file",
        accept: ".json",
        multiple: false,
        maxCount: 1,
        directory: false,
        beforeUpload: async (file) => {
            try {
                const data = await API.automation.dagsGet();
                if (data?.data?.total && data?.data?.total >= 50) {
                  modalInfo(
                    t("err.title.create", "无法新建自动任务"),
                    t(
                      "err.tasksExceeds",
                      "您新建的自动任务数已达上限。（最多允许新建50个）"
                    )
                  );
                  // Modal.info({
                  //   title: t("err.title.create", "无法新建自动任务"),
                  //   okText: t("ok", "确定"),
                  //   content: (
                  //     <div>
                  //       {t(
                  //         "err.tasksExceeds",
                  //         "您新建的自动任务数已达上限。（最多允许新建50个）"
                  //       )}
                  //     </div>
                  //   ),
                  //   onOk() {},
                  // });
                  return;
                }
            } catch (error: any) {
                if (
                    error?.response?.data?.code ===
                    "ContentAutomation.Forbidden.ServiceDisabled"
                ) {
                    onChangeConfig({ ...config, isServiceOpen: false });
                    modalInfo(
                      t("err.title.create", "无法新建自动任务"),
                      t("notEnable", "当前工作流未开启，请联系管理员")
                    );
                    return;
                }
                handleErr({ error: error?.response });
                return;
            }
            try {
                const blob = new Blob([file]);
                const size = blob.size;
                if (size > 20 * 1024 * 1024) {
                  modalInfo(
                    t("err.title.import", "无法导入自动任务"),
                    t("err.overLimit.import", "导入的文件大小不能超过20MB。")
                  );
                  return;
                }
                let jsonText = "";
                const reader = new FileReader();
                reader.onload = function (e) {
                    jsonText = e.target?.result as string;
                    const config = JSON.parse(jsonText);
                    if (config?.steps) {
                        microWidgetProps?.components?.toast.info(
                            t("import.waiting", "正在导入…"),
                            1
                        );
                        const templateId = Math.random()
                            .toString(36)
                            .slice(2, 7);
                        sessionStorage.setItem(
                            `automateTemplate-${templateId}`,
                            jsonText
                        );
                        navigate(
                            `/new?model=${templateId}&local=1&back=${btoa(
                                location.pathname
                            )}`
                        );
                    } else {
                      modalInfo(
                        t("err.title.import", "无法导入自动任务"),
                        t("import.fail", "导入的文件解析失败。")
                      );
                    }
                };
                reader.onerror = (e) => {
                    console.error(e);
                    modalInfo(
                        t("err.title.import", "无法导入自动任务"),
                        t("import.fail", "导入的文件解析失败。")
                      );
                };
                reader.readAsText(blob);
            } catch (e) {
                console.error(e);
                modalInfo(
                  t("err.title.import", "无法导入自动任务"),
                  t("import.fail", "导入的文件解析失败。")
                );
            }
            return false;
        },
        showUploadList: false,
    };

    const { data: count = { docAuditClient: 0 } } = useSWR(
        ["getCount", hasAudit],
        async () => {
            if (hasAudit) {
                try {
                    const {
                        data: { count = 0 },
                    } = await API.axios.get(
                        `${prefixUrl}/api/doc-audit-rest/v1/doc-audit/tasks/count`
                    );
                    return { docAuditClient: count };
                } catch (error) {
                    return { docAuditClient: 0 };
                }
            }
        },
        {
            revalidateOnFocus: hasAudit,
        }
    );

    const handleConfirm = () => {
        setShowGuid(false);
        localStorage.setItem("automateGuide", "1");
        setShowPopTip(true);
        onChangeConfig({ ...config, shouldShowGuide: false });
    };

    useEffect(() => {
        if (config.shouldShowGuide === true) {
            setShowGuid(true);
        }
    }, [config.shouldShowGuide]);

    useEffect(() => {
      const docAuditApp = microWidgetProps?.config?.getMicroWidgetByName(
        "doc-audit-client",
        true
      );
      if (docAuditApp) {
        setHasAudit(true);
      }
    }, []);

    const isCustomExecutorAccessible = useCustomExecutorAccessible();
    const enabledTabs: any = useTilterTabs()

    const HeadNav = useMemo(
        () => [
            // { key: "/", name: t("nav.home", "主页") },
            { key: "/nav/list", name: t("nav.list", "我的流程") },
            // { key: "/nav/template", enabledFields: TabFields.ProcessTemplate, name: t("nav.template", "流程模板") },
            // { key: "|" },
            // { key: "/nav/model", enabledFields: TabFields.AICapabilities, name: t("nav.model", "AI 能力") },
            { key: "/nav/doc-audit-client", name: "审核待办", isNewTab: true, path: 'doc-audit-client' },
            { key: "/nav/auditTemplate", name: "审核模板", isNewTab: true, path: 'workflow-manage-client' },
            // ...(isCustomExecutorAccessible
            //     ? [
            //         {
            //             key: "/nav/executors",
            //             name: t("nav.executors", "我的节点"),
            //         },
            //     ]
            //     : []),
        ].filter(({ enabledFields }: any) => !enabledFields || isEmpty(enabledTabs) || enabledTabs[enabledFields]),
        [t, isCustomExecutorAccessible, enabledTabs]
    );

    return (
      <>
        <div className={styles["header"]}>
          <div className={styles["menu-nav"]}>
            {HeadNav.map((item, index) => {
              if (item.key === "|") {
                return (
                  <div
                    key={`|${index}`}
                    className={styles["nav-divider"]}
                  ></div>
                );
              }
              return (
                <span
                  key={item.key}
                  className={clsx(styles["nav-item"], {
                    checked: isChecked(item.key),
                  })}
                  data-oem="automate-oem-tab"
                  onClick={() => {
                    if(item.isNewTab){
                       navigateToMicro(item.path) 
                       return
                    }
                    navigate(item.key)
                  }}
                >
                  {item.name}
                </span>
              );
            })}
          </div>
          <div className={styles["extra-nav"]}>
            {/* {hasAudit && (
              <Button
                key="docAuditClient"
                type="link"
                title={t("nav.docAudit", "审核待办")}
                className={styles["link-btn"]}
                icon={
                  <Badge
                    count={count.docAuditClient}
                    overflowCount={99}
                    size="small"
                    color="#FF4D4F"
                    className={clsx(styles["extra-btn-badge"], {
                      [styles["three-length"]]: count.docAuditClient > 100,
                    })}
                  >
                    <AuditColored
                      style={{ transform: "translateY(1px)" }}
                      className={styles["nav-icon"]}
                    />
                  </Badge>
                }
                onClick={() => navigateToMicro("doc-audit-client")}
              />
            )} */}
            {/* {hasAudit && (
              <Button
                key="workflowManageClient"
                type="link"
                title={t("nav.workflowClient", "审核模板")}
                className={styles["link-btn"]}
                icon={<FlowsColored className={styles["workflow-icon"]} />}
                onClick={() => navigateToMicro("workflow-manage-client")}
              />
            )} */}
            {/* <Popover
                        open={showPopTip}
                        placement="topRight"
                        arrowPointAtCenter={true}
                        overlayClassName={clsx(styles["pop-wrapper"], {
                            [styles["ie"]]:
                                typeof (window.navigator as any)
                                    .msSaveOrOpenBlob === "function",
                        })}
                        align={{ offset: [26, -8] }}
                        content={
                            <div className={styles["guide-pop"]}>
                                <p>
                                    {t("guide.tip", "快速入门可以在这里查看")}
                                </p>
                                <Button
                                    size="small"
                                    className={clsx(
                                        styles["knowButton"],
                                        "automate-oem-primary-btn"
                                    )}
                                    onClick={() => setShowPopTip(false)}
                                >
                                    {t("guide.know", "我知道了")}
                                </Button>
                            </div>
                        }
                    >
                        <Button
                            key="information"
                            type="link"
                            title={t("nav.information", "快速入门")}
                            className={styles["link-btn"]}
                            icon={
                                <QuickGuideColored
                                    className={styles["nav-icon"]}
                                />
                            }
                            onClick={() => {
                                navigateToMicro("work-center-guide");
                            }}
                        />
                    </Popover> */}
            {config?.isAdmin ? (
              <>
                <div key={`|-python`} className={styles["nav-divider"]}></div>
                <Button
                  key="workflowManageClient"
                  type="link"
                  title={t("pythonPackage", "Python包管理")}
                  className={styles["link-btn"]}
                  icon={<FlowsColored className={styles["workflow-icon"]} />}
                  onClick={() =>
                    navigate(`/pythonPackages?back=${btoa(location.pathname)}`)
                  }
                />
              </>
            ) : null}
            <Dropdown
              trigger={["hover"]}
              transitionName=""
              placement="bottomRight"
              overlayClassName={styles["create-drop-menu"]}
              overlay={
                <Menu
                  selectable
                  onClick={({ key }) => {
                    handleCreateTask(key);
                  }}
                >
                  <Menu.ItemGroup
                    title={t("createGroup.empty", "从空白流程新建")}
                  >
                    <Menu.Item
                      key="new-event"
                      icon={
                        <TriggerEventColored className={styles["btn-icon"]} />
                      }
                    >
                      {t("create.event", "事件触发")}
                    </Menu.Item>
                    <Menu.Item
                      key="new-cron"
                      icon={
                        <TriggerClockColored className={styles["btn-icon"]} />
                      }
                    >
                      {t("create.clock", "定时触发")}
                    </Menu.Item>
                    <Menu.Item
                      key="new-manual"
                      icon={
                        <TriggerManualColored className={styles["btn-icon"]} />
                      }
                    >
                      {t("create.manual", "手动触发")}
                    </Menu.Item>
                  </Menu.ItemGroup>
                  {/* <Menu.Divider></Menu.Divider> */}
                  {/* <Menu.ItemGroup
                    title={t("createGroup.template", "从流程模板新建")}
                  >
                    <Menu.Item
                      key="template"
                      icon={
                        <AutomationTemplateColored
                          className={styles["template-icon"]}
                        />
                      }
                    >
                      {t("newBtn.template", "选择流程模板")}
                    </Menu.Item>
                  </Menu.ItemGroup> */}
                  <Menu.Divider></Menu.Divider>
                  <Menu.ItemGroup title={t("createGroup.import", "从本地导入")}>
                    <Menu.Item key="import" className={styles["import-menu"]}>
                      <Upload
                        {...uploadProps}
                        className={styles["import-item"]}
                      >
                        <ImportOutlined className={styles["import-icon"]} />
                        <span className={styles["import-text"]}>
                          {t("header.import", "选择本地文件")}
                        </span>
                      </Upload>
                    </Menu.Item>
                  </Menu.ItemGroup>
                </Menu>
              }
            >
              <Button
                key="new"
                type="primary"
                className={clsx(
                  styles["newButton"],
                  "automate-oem-primary-btn"
                )}
                icon={<AddOutlined className={styles["newButtonIcon"]} />}
              >
                <div className={styles["newButton-content"]}>
                  {t("nav.new", "新建")}
                  <MinarrowDownOutlined className={styles["arrow-icon"]} />
                </div>
              </Button>
            </Dropdown>
          </div>
          {showTemplateModal && (
            <TemplateSelectModal onClose={() => setShowTemplateModal(false)} />
          )}
        </div>
        <Modal
          open={false}
          title={null}
          className={styles["modal"]}
          width={640}
          onCancel={handleConfirm}
          centered
          closable
          maskClosable={false}
          footer={null}
          transitionName=""
        >
          <Carousel
            autoplay
            autoplaySpeed={10000}
            beforeChange={() => {
              if (hiddenSecondPage) {
                setHiddenPage(false);
              }
            }}
          >
            <div>
              <div className={styles["modal-container"]}>
                <div className={styles["top-content"]}>
                  <section className={styles["left-wrapper"]}>
                    <img src={guideImg} alt="" />
                  </section>
                  <section className={styles["right-wrapper"]}>
                    <div className={styles["right-title"]}>
                      {t("guide.title1", "什么是工作流程自动化？")}
                    </div>
                    <div className={styles["right-description"]}>
                      {t(
                        "guide.text1",
                        "自动化的工作流程可以帮您免除一系列重复性、机械化的文档操作，进一步提升内容流转和处理的效率。"
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <div>
              <div className={styles["modal-container"]}>
                <div className={styles["top-content"]}>
                  <section className={styles["left-wrapper"]}>
                    <img src={guideImg} alt="" />
                  </section>
                  <section
                    className={styles["right-wrapper"]}
                    hidden={hiddenSecondPage}
                  >
                    <div className={styles["right-title"]}>
                      {t("guide.title2", "工作流程可以帮我做什么？")}
                    </div>
                    <ul>
                      <li>
                        <GuideListColored className={styles["li-icon"]} />
                        {t("guide.li1", "上传文件根据目录结构自动添加标签")}
                      </li>
                      <li>
                        <GuideListColored className={styles["li-icon"]} />
                        {t("guide.li2", "自动归档创建时间过长的文件")}
                      </li>
                      <li>
                        <GuideListColored className={styles["li-icon"]} />
                        {t("guide.li3", "自动识别文件后基于自定义规则移动")}
                      </li>
                      <li>
                        <GuideListColored className={styles["li-icon"]} />
                        ……
                      </li>
                    </ul>
                    <div className={styles["right-description"]}>
                      {t(
                        "guide.text2",
                        "30+动作节点、10+流程模板，无需代码与技术基础，即可让您的业务流程自动运转起来。"
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </Carousel>
          <div>
            <Button
              type="primary"
              className={clsx(
                styles["confirm-btn"],
                "automate-oem-primary-btn"
              )}
              onClick={handleConfirm}
            >
              {t("guide.confirm", "开始使用")}
            </Button>
          </div>
        </Modal>
      </>
    );
};
