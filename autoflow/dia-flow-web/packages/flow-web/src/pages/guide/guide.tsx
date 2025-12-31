import { useContext, useMemo } from "react";
import { MicroAppContext, useTranslate } from "@applet/common";
import styles from "./guide.module.less";
import exampleZh from "../../assets/example-zh.png";
import exampleTw from "../../assets/example-tw.png";
import exampleEn from "../../assets/example-en.png";
import exampleVi from "../../assets/example-vi.jpg";
// import triggerCN from "../../assets/trigger-zh.mp4";
// import executorCN from "../../assets/executor-zh.mp4";
// import scene1CN from "../../assets/scene1-zh.mp4";
// import scene2CN from "../../assets/scene2-zh.mp4";
// import scene3CN from "../../assets/scene3-zh.mp4";
import { detectIE } from "../../utils/browser";
import guide1Img from "../../assets/guide-1.png";
import guide2Img from "../../assets/guide-2.png";

export const GuidePage = () => {
    const t = useTranslate();
    const { microWidgetProps } = useContext(MicroAppContext);
    const lang = microWidgetProps?.language?.getLanguage;

    const isIE = useMemo(() => {
        return detectIE();
    }, []);

    const basePath = microWidgetProps?.history?.getBasePath as string;
    const isInElectron =
        microWidgetProps?.config?.systemInfo?.platform === "electron";
    const initialEntries = isInElectron
        ? basePath.split("#")[1] + "guide?"
        : "";

    const getExampleImg = () => {
        switch (lang) {
            case "zh-tw":
                return (
                    <img style={{ width: "800px" }} src={exampleTw} alt="" />
                );
            case "en-us":
                return (
                    <img style={{ width: "800px" }} src={exampleEn} alt="" />
                );
            // @ts-ignore    
            case "vi-vn":
                return (
                    <img style={{ width: "800px" }} src={exampleVi} alt="" />
                );
            default:
                return (
                    <img style={{ width: "800px" }} src={exampleZh} alt="" />
                );
        }
    };

    return (
        <div className={styles["container"]}>
            <section>
                <p>
                    {t("guidePage.text1", "阅读此快速入门，您将可以学习到：")}
                </p>
                <div>
                    <a
                        href={`#${initialEntries}guide-1`}
                        className={styles["nav-title"]}
                    >
                        {t("guidePage.modelText1", "工作流程入门")}
                    </a>
                </div>
                <div className={styles["nav-link"]}>
                    <div>
                        <a href={`#${initialEntries}guide-1.1`}>
                            {t("guidePage.text2", "什么是工作流程自动化？")}
                        </a>
                    </div>
                    <div>
                        <a href={`#${initialEntries}guide-1.2`}>
                            {t("guidePage.text4", "使用工作流程可以做什么？")}
                        </a>
                    </div>
                    <div>
                        <a href={`#${initialEntries}guide-1.3`}>
                            {t(
                                "guidePage.understandingTitle",
                                "工作流程基础概念理解"
                            )}
                        </a>
                    </div>
                    <div>
                        <a href={`#${initialEntries}guide-1.4`}>
                            {t("guidePage.title3", "工作流程是如何运行的？")}
                        </a>
                    </div>
                    <div>
                        <a href={`#${initialEntries}guide-1.5`}>
                            {t("guidePage.text17", "怎样新建和管理工作流程？")}
                        </a>
                    </div>
                    <div>
                        <a href={`#${initialEntries}guide-1.6`}>
                            {t("guidePage.scene.title", "工作流程使用场景介绍")}
                        </a>
                    </div>
                </div>
                <div>
                    <a
                        href={`#${initialEntries}guide-2`}
                        className={styles["nav-title"]}
                    >
                        {t(
                            "guidePage.modelText2",
                            "将AI模型融入工作流程，丰富您的工作流场景"
                        )}
                    </a>
                </div>
                <div className={styles["nav-link"]}>
                    <div>
                        <a href={`#${initialEntries}guide-2.1`}>
                            {t("guidePage.modelText3", "模型库概述")}
                        </a>
                    </div>
                    <div>
                        <a href={`#${initialEntries}guide-2.2`}>
                            {t("guidePage.modelText4", "在工作流程中使用模型")}
                        </a>
                    </div>
                </div>
            </section>
            <section>
                <h1 id={`${initialEntries}guide-1`}>
                    {t("guidePage.modelText1", "工作流程入门")}
                </h1>
                <p>
                    {t(
                        "guidePage.modelText5",
                        "工作中心支持工作流程自动化，您可以基于实际的业务场景，轻松拖拽符合业务需求的自动化流程。"
                    )}
                </p>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-1.1`}>
                    {t("guidePage.text2", "什么是工作流程自动化？")}
                </h2>
                <p>
                    {t(
                        "guidePage.text3",
                        "自动化的工作流程可以帮您免除一系列重复性、机械化的文档操作，进一步提升内容流转和处理的效率。"
                    )}
                </p>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-1.2`}>
                    {t("guidePage.text4", "使用工作流程可以做什么？")}
                </h2>
                <p>
                    {t(
                        "guidePage.text5",
                        "在传统业务场景中，人工进行数据同步或者大量文档的复制、移动操作既费时又费力，且容易出错，有了自动化工作流程，就可以对您的文档自动进行协同办公、内容提取、数据收集、数据同步、消息提醒等各类操作。"
                    )}
                </p>
                <p>{t("guidePage.text6", "例如，可以自动执行以下任务：")}</p>
                <ul>
                    <li>
                        {t(
                            "guidePage.text7",
                            "在指定文件夹内上传文件后触发审核；"
                        )}
                    </li>
                    <li>
                        {t(
                            "guidePage.text8",
                            "新建文件夹时，自动为文件夹添加编目模板；"
                        )}
                    </li>
                    <li>
                        {t("guidePage.text9", "自动保存表格附件到指定路径；")}
                    </li>
                    <li>
                        {t(
                            "guidePage.text10",
                            "基于创建时间，对文件自动归档；"
                        )}
                    </li>
                    <li>……</li>
                </ul>
                <p>
                    {t(
                        "guidePage.text11",
                        "30+动作节点，10+流程模板，无需代码开发与技术基础，即可让您的业务流程自动运转起来。"
                    )}
                </p>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-1.3`}>
                    {t("guidePage.understandingTitle", "工作流程基础概念理解")}
                </h2>
                <p>
                    {t(
                        "guidePage.understandingText1",
                        "前面我们快速了解了工作流程的概况和各类使用场景，现在您可以学习工作流程中所使用到的一些基础概念："
                    )}
                </p>
                <p>
                    {t("guidePage.understandingText2.1", "“当设定的")}
                    <span className={styles["bold"]}>
                        {t("guidePage.understandingText2.2", "触发动作")}
                    </span>

                    {t("guidePage.understandingText2.3", "发生时，满足")}
                    <span className={styles["bold"]}>
                        {t("guidePage.understandingText2.4", "执行条件")}
                    </span>
                    {t("guidePage.understandingText2.5", "后执行设定的")}
                    <span className={styles["bold"]}>
                        {t("guidePage.understandingText2.6", "执行动作")}
                    </span>
                    {t("guidePage.understandingText2.7", "”")}
                </p>
                {getExampleImg()}
                <p className={styles["bold"]}>
                    {t("guidePage.understandingText3", "触发动作：")}
                </p>
                <p>
                    {t(
                        "guidePage.understandingText4",
                        "触发动作是自动化工作流程的起点，根据该触发动作的状态变化，来作为自动化流程是否执行的起始判断，例如上述案例中，在知识库上传一个新的文档就是流程的开始。"
                    )}
                </p>
                <p>
                    {t("guidePage.understandingText5.1", "常见的触发动作有")}
                    <span className={styles["bold"]}>
                        {t(
                            "guidePage.understandingText5.2",
                            "事件触发、手动触发、表单触发、定时触发"
                        )}
                    </span>
                    {t(
                        "guidePage.understandingText5.3",
                        "，下面将带您了解这几种触发动作的基本概念："
                    )}
                </p>
                <ul>
                    <li>
                        <p>
                            {t(
                                "guidePage.understandingText6.1",
                                "事件触发：通过设置指定操作事件作为触发动作。一般适用于需要对文件和文件夹进行"
                            )}
                            <span className={styles["bold"]}>
                                {t(
                                    "guidePage.understandingText6.2",
                                    "数据新建或变更"
                                )}
                            </span>
                            {t(
                                "guidePage.understandingText6.3",
                                "操作的场景，也就是需要选择目标文件夹，并且在该文件夹下进行上传、复制、移动或删除的动作时，再执行下一步的操作。示例：新建文件夹时，自动将文件夹名称添加到编目模板。"
                            )}
                        </p>
                    </li>
                    <li>
                        <p>
                            {t(
                                "guidePage.understandingText7.1",
                                "手动触发：手动触发是在设置完自动化任务后，需要您手动点击运行，才会触发下一步的执行动作。与事件触发不同，手动触发的对象是针对已经上传至某个文件夹下的文件或文件夹，再手动点击，去进行下一步需要执行的动作，主要用于"
                            )}
                            <span className={styles["bold"]}>
                                {t(
                                    "guidePage.understandingText7.2",
                                    "数据同步"
                                )}
                            </span>
                            {t(
                                "guidePage.understandingText7.3",
                                "的场景。示例：在文档中心里存放了一个创建时间过长的文件夹，可设置自动归档到另一个指定的文件夹。"
                            )}
                        </p>
                    </li>
                    <li>
                        <p>
                            {t(
                                "guidePage.understandingText8.1",
                                "表单触发：设置表单提交为触发动作。适用于利用表单"
                            )}
                            <span className={styles["bold"]}>
                                {t(
                                    "guidePage.understandingText8.2",
                                    "协同办公"
                                )}
                            </span>
                            {t(
                                "guidePage.understandingText8.3",
                                "的场景，可以是文档权限的申请、合同类文件审核通过后的流转管理、填写表单发起扩容申请流程等。"
                            )}
                        </p>
                    </li>
                    <li>
                        <p>
                            {t(
                                "guidePage.cronText1.1",
                                "定时触发：触发动作为循环的时间周期或时间点，例如每x分钟、每x小时、每天或每周等固定周期。在实际工作中，有一些任务需要在特定的时间完成，主要适用于"
                            )}
                            <span className={styles["bold"]}>
                                {t("guidePage.cronText1.2", "消息提醒")}
                            </span>
                            {t(
                                "guidePage.cronText1.3",
                                "类的场景，可以规定工作流程运行的时间和频率。示例：文件更新后自动通知到相关人员、每周自动提醒项目负责人更新进展、定期将数据备份到指定的文件夹等。"
                            )}
                        </p>
                    </li>
                </ul>
                <p className={styles["bold"]}>
                    {t("guidePage.understandingText9", "执行条件：")}
                </p>
                <p>
                    {t("guidePage.understandingText10.1", "执行条件也叫")}
                    <span className={styles["bold"]}>
                        {t("guidePage.understandingText10.2", "逻辑动作")}
                    </span>
                    {t(
                        "guidePage.understandingText10.3",
                        "，只有满足这个条件，才会往下执行设定的操作。通俗来讲就是工作流程中的"
                    )}
                    <span className={styles["bold"]}>
                        {t("guidePage.understandingText10.4", "分支")}
                    </span>
                    {t(
                        "guidePage.understandingText10.5",
                        "，分支的运行顺序是按照分支从左往右依次匹配，只有当前分支条件满足后，才执行该分支的流程。一个分支操作内的所有分支执行完毕后，再执行分支外的操作。上述案例中，“审核通过→文件上传”可以理解为该流程中的分支1，而如果审核不通过，则可以删除该文件，那么“审核不通过→删除文件”就是分支2。"
                    )}
                </p>
                <p className={styles["bold"]}>
                    {t("guidePage.understandingText11", "执行动作：")}
                </p>
                <p>
                    {t(
                        "guidePage.understandingText12",
                        "执行条件也叫逻辑动作，只有满足这个条件，才会往下执行设定的操作。通俗来讲就是工作流程中的分支，分支的运行顺序是按照分支从左往右依次匹配，只有当前分支条件满足后，才执行该分支的流程。一个分支操作内的所有分支执行完毕后，再执行分支外的操作。上述案例中，“审核通过→文件上传”可以理解为该流程中的分支1，而如果审核不通过，则可以删除该文件，那么“审核不通过→删除文件”就是分支2。"
                    )}
                </p>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-1.4`}>
                    {t("guidePage.title3", "工作流程是如何运行的？")}
                </h2>
                <p>
                    {t(
                        "guidePage.text12",
                        "仅需要设置“触发器”和“执行操作”，即可开始运行自动化的工作流程。"
                    )}
                </p>
                <ul>
                    <li>
                        <p>
                            {t("guidePage.text13.1", "第一步：设置")}
                            <span className={styles["bold"]}>
                                {t("guidePage.text13.2", "触发器")}
                            </span>
                        </p>
                        <p>
                            {t(
                                "guidePage.text14",
                                "触发器可以理解为“当某事件发生时，执行后续操作“中的某事件。例如，“当上传文档时，自动添加文档标签”，其中“上传文件”就是触发器。在一个自动化工作流程中，触发器是自动化流程的开端，一个流程只能配置一个触发器，且不能删除。"
                            )}
                        </p>
                        {/* {!isIE ? (
                            <video
                                style={{ width: "1160px" }}
                                autoPlay
                                loop
                                muted
                            >
                                (
                                <source src={triggerCN} type="video/mp4" />)
                                <p>
                                    {t(
                                        "guidePage.upgrade",
                                        "您的浏览器版本偏低，请升级最新版查看"
                                    )}
                                </p>
                            </video>
                        ) : (
                            <div className={styles["not-support"]}>
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </div>
                        )} */}
                    </li>
                    <li>
                        <p>
                            {t("guidePage.text15.1", "第二步：设置")}
                            <span className={styles["bold"]}>
                                {t("guidePage.text15.2", "执行操作")}
                            </span>
                        </p>
                        <p>
                            {t(
                                "guidePage.text16",
                                "执行操作是指当触发器事件发生后，用于处理数据或传递数据而执行实际的具体操作。比如，在“更新文件后自动通知到相关人员”中，“通知到相关人员”就是具体的执行操作。同一个流程中，您可以设置一个或多个执行操作。"
                            )}
                        </p>
                        {/* {!isIE ? (
                            <video
                                style={{ width: "1160px" }}
                                autoPlay
                                loop
                                muted
                            >
                                <source src={executorCN} type="video/mp4" />
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </video>
                        ) : (
                            <div className={styles["not-support"]}>
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </div>
                        )} */}
                    </li>
                </ul>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-1.5`}>
                    {t("guidePage.text17", "怎样新建和管理工作流程？")}
                </h2>
                <p>{t("guidePage.text18", "有三种简便的方式可以新建流程：")}</p>
                <div className={styles["left-20"]}>
                    <ol>
                        <li>
                            <span className={styles["bold"]}>
                                {t("guidePage.text19.1", "从空白流程新建。")}
                            </span>
                        </li>
                        <li>
                            <span className={styles["bold"]}>
                                {t("guidePage.text23.1", "从流程模板新建。")}
                            </span>
                            {t(
                                "guidePage.text23.2",
                                "我们在“流程模板”中提供了一些针对常见场景的自动化流程模板，帮助您快速创建应对各种业务场景的流程。"
                            )}
                        </li>
                        <li>
                            <span className={styles["bold"]}>
                                {t("guidePage.text24.1", "从本地导入。")}
                            </span>
                            {t(
                                "guidePage.text24.2",
                                "当流程较为个性化，无法提炼成模板时，您可以选择将本地已有的模板包导入，以便更加快捷地完成操作。"
                            )}
                        </li>
                    </ol>
                </div>
                <p>
                    {t(
                        "guidePage.text25",
                        "在【工作中心】顶部栏中，可以点击【我的流程】，管理您所创建的流程，以及查看分配给您的流程。"
                    )}
                </p>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-1.6`}>
                    {t("guidePage.scene.title", "工作流程使用场景介绍")}
                </h2>
                <ul>
                    <li>
                        <p>
                            {t(
                                "guidePage.scene1.name",
                                "场景一:知识库发布文件审核"
                            )}
                        </p>
                        <p>
                            {t(
                                "guidePage.scene1.description",
                                "需求描述:在知识库发布文件时，需经过领导审核内容，审核通过后，文件发布成功。"
                            )}
                        </p>
                        {/* {!isIE ? (
                            <video
                                style={{ width: "1160px" }}
                                autoPlay
                                loop
                                muted
                            >
                                <source src={scene1CN} type="video/mp4" />
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </video>
                        ) : (
                            <div className={styles["not-support"]}>
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </div>
                        )} */}
                    </li>
                    <li>
                        <p>
                            {t(
                                "guidePage.scene2.name",
                                "场景二：某电商企业文件过期后需自动归档"
                            )}
                        </p>
                        <p>
                            {t(
                                "guidePage.scene2.description",
                                "需求描述：某电商的图片库中存放着大量的拍摄样片，这些样片具有时效性，一旦过季，这些样片需要被下线归档。"
                            )}
                        </p>
                        {/* {!isIE ? (
                            <video
                                style={{ width: "1160px" }}
                                autoPlay
                                loop
                                muted
                            >
                                <source src={scene2CN} type="video/mp4" />
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </video>
                        ) : (
                            <div className={styles["not-support"]}>
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </div>
                        )} */}
                    </li>
                    <li>
                        <p>
                            {t(
                                "guidePage.scene3.name",
                                "场景三：某建筑单位自动给文件夹添加编目属性"
                            )}
                        </p>
                        <p>
                            {t(
                                "guidePage.scene3.description",
                                "需求描述：某建筑单位在管理项目文档时，会用 档案分类号+分类描述 的形式，作为文件夹的名称，来创建文件夹的多级结构。在创建好一个文件夹时，期望给文件夹自动设置编目模板，同时将文件夹名称中的「档案分类号」作为编目模板中的某一个字段，填入进去。"
                            )}
                        </p>
                        {/* {!isIE ? (
                            <video
                                style={{ width: "1160px" }}
                                autoPlay
                                loop
                                muted
                            >
                                <source src={scene3CN} type="video/mp4" />
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </video>
                        ) : (
                            <div className={styles["not-support"]}>
                                {t(
                                    "guidePage.upgrade",
                                    "您的浏览器版本偏低，请升级最新版查看"
                                )}
                            </div>
                        )} */}
                    </li>
                </ul>
            </section>
            <p>
                {t(
                    "guidePage.text26",
                    "现在，试试新建您自己的自动化工作流程吧！"
                )}
            </p>
            <section style={{ marginTop: "40px" }}>
                <h1 id={`${initialEntries}guide-2`}>
                    {t(
                        "guidePage.modelText2",
                        "将AI模型融入工作流程，丰富您的工作流场景"
                    )}
                </h1>
                <p>
                    {t(
                        "guidePage.modelText6",
                        "工作中心引入模型库，结合AI模型能力，包括大语言模型、OCR模型、自动提取模型，支撑您拓展更丰富的业务场景。以下是这些模型能力的简要介绍："
                    )}
                </p>
                <div className={styles["left-20"]}>
                    <ul>
                        <li>
                            <span className={styles["bold"]}>
                                {t("guidePage.modelText7.1", "大语言模型")}
                            </span>

                            {t(
                                "guidePage.modelText7.2",
                                "，Large Language Model (LLM)，是一种基于深度学习的技术，它使用大量的文本数据进行训练，从而学习到丰富的语言知识。这种模型的能力可以充分运用在我们的工作流程中，如总结文本摘要、会议信息等。"
                            )}
                        </li>
                        <li>
                            <span className={styles["bold"]}>
                                {t("guidePage.modelText8.1", "OCR模型")}
                            </span>

                            {t(
                                "guidePage.modelText8.2",
                                "，是一种用于将图像中的文本转换为计算机可读格式的技术，通常包括图像预处理和特征提取，使用此模型，可以自动对图片或PDF文件进行文字识别，可运用的业务场景有：从发票或身份证中提取信息、通用文字识别等。"
                            )}
                        </li>
                        <li>
                            <span className={styles["bold"]}>
                                {t("guidePage.modelText9.1", "自动提取模型")}
                            </span>

                            {t(
                                "guidePage.modelText9.2",
                                "能够自动识别和提取数据中的关键信息，从而提高数据处理的效率和准确性，可以运用在定制化的场景中，例如从文档中提取标签或自定义信息。"
                            )}
                        </li>
                    </ul>
                </div>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-2.1`}>
                    {t("guidePage.modelText3", "模型库概述")}
                </h2>
                <p>
                    {t(
                        "guidePage.modelText11",
                        "模型库用于展示工作流程中运用到的AI模型，支持用户测试模型效果，后续可支持用户新建及训练模型。简单来说，如果说工作流程是双手，可以将一个应用中的数据输入到另一个应用中，那么AI模型就是它的大脑，可以从未结构化的数据源中提取信息。"
                    )}
                </p>
                <div className={styles["left-20"]}>
                    <ul>
                        <li>
                            {t(
                                "guidePage.modelText12.1",
                                "目前我们的工作流程中有许多需求，为了能够处理通用文档、图像等非结构化数据，以及身份证、营业执照、增值税发票、火车票识别等结构化数据，我们将预生成的AI能力引入了工作流程，也就是借助AI预生成的模型。"
                            )}
                            <span className={styles["bold"]}>
                                {t("guidePage.modelText12.2", "预生成的AI模型")}
                            </span>
                            {t(
                                "guidePage.modelText12.3",
                                "，无需收集数据、生成、训练和发布，即可快速使用在您的工作流程中。"
                            )}
                        </li>
                        <li>
                            {t(
                                "guidePage.modelText13.1",
                                "而为了能够使模型理解专业领域的文档，我们提供了定制化的AI能力，需要您上传自己的数据，通过标注、训练并优化AI模型，也就是在基础模型之上，用户根据需要对其进行训练的配置。例如，通过添加少量样本文档，再标注需要提取的文本信息，最后来创建符合业务场景的"
                            )}
                            <span className={styles["bold"]}>
                                {t("guidePage.modelText13.2", "自定义模型")}
                            </span>

                            {t(
                                "guidePage.modelText13.3",
                                "，发布训练完的版本后，就可以在工作流程中使用此模型了。"
                            )}
                        </li>
                    </ul>
                </div>
            </section>
            <section>
                <h2 id={`${initialEntries}guide-2.2`}>
                    {t("guidePage.modelText4", "在工作流程中使用模型")}
                </h2>
                <div className={styles["left-20"]}>
                    <ol>
                        <li>
                            <p>
                                {t(
                                    "guidePage.modelText14",
                                    "您可以直接从【模型库】进入，选择已经训练好的模型，例如，从发布文档中总结信息，再点击【选择文件测试】。"
                                )}
                            </p>
                            <img src={guide1Img} alt="" />
                        </li>
                        <li>
                            <p>
                                {t(
                                    "guidePage.modelText15",
                                    "选择【在工作流中运用】，这样就可以生成一个利用大模型提取文档关键内容自动生成发布文档的工作流程。"
                                )}
                            </p>
                            <img src={guide2Img} alt="" />
                        </li>
                    </ol>
                </div>
            </section>
        </div>
    );
};
