import { request } from "../../tools/request";
import { urlDecorator } from "../../tools/decorator";
import { ServiceInfo, AccessAddress } from "./declare";
import trans from "../../locale";
import __ from "../locale";

/**
 * ShareWebStudio存在备份，需要两边同时修改
 */

/**
 * 服务类型
 */
export const ServicesType = {
    // 产品
    Product: "Product",
    // 子产品
    SubProduct: "SubProduct",
    // 内容服务
    ContentService: "ContentService",
    // 第三方内容服务
    ThridContentService: "ThridContentService",
};

/**
 * 服务类型名称
 */
export const ServicesTypeText = {
    [ServicesType.Product]: trans("产品"),
    [ServicesType.SubProduct]: trans("子产品"),
    [ServicesType.ContentService]: trans("内容服务"),
    [ServicesType.ThridContentService]: trans("第三方内容服务"),
};

/**
 * 服务类型
 */
export const Services = {
    // 杀毒服务
    EAntivirus: "RealtimeAntivirusService",
    // 内容分析服务
    ContentAnalysis: "ContentAnalysisAndRetrievalAdvancedService",
    // 文档集服务
    DocumentSet: "document-set-service",
    // AutoSheets
    AutoSheets: "AutoSheets",
    // 扩展元数据服务
    Metadata: "ExtendedMetadataService",
    // InfoInsight
    // InfoInsight: "InfoInsight",
    // 外发包副文档服务
    EgressPackage: "egress-package-microservice",
    // OCR
    OCR: "IntSigOCRService",
    // 加密副文档服务
    EncryptionMicroservice: "encryption-microservice",
    // Office 在线编辑和预览服务
    OfficeOnline: "OfficeOnlineEditingAndPreviewService",
    // ECeph对象存储服务
    ECeph: "eceph-service",
    // nas网关
    NasGateway: "nas-gateway-service",
    // AnyShare Wokflow 服务
    Workflow: "WorkflowService",
    // AnyShare 内容就近处理服务
    NearbyContentProcessing: "nearby-content-processing-service",
    // AnyShare WPS Online 在线编辑和预览服务
    WpsOnline: "WPSOnlineEditingAndPreviewService",
    // wps 代理服务
    WpsCore: "WPSOnlineEditingAndPreviewCoreService",
    // knowledge center
    KnowledgeCenter: "KnowledgeCenter",
    // AnyShare主模块 等于原来的 MainModule
    ManagementConsole: "ManagementConsole",
    // AnyData微服务
    AnyDATA: "AnyDATA",
    // Observability服务
    Observability: "Observability",
    // AnyFabric服务
    AnyFabric: "AnyFabric",
    // 亿赛通数据安全集成服务
    EsafenetDLPService: "EsafenetDLPService",
    // 华途数据安全集成服务
    VamtooDLPService: "VamtooDLPService",
    // SAP 智能内容管理服务
    SAPIntelligentContentManagement: "SAPIntelligentContentManagementService",
    // 永中offcie在线编辑服务
    YOZOOffice: "YOZOOfficeOnlineEditingAndPreviewService",
    // IPGuard数据安全集成服务
    IPGuardDLPService: "IPGuardDLPService",
    //天空卫士数据安全集成服务
    SkyGuard: "SkyGuardDLPService",
    //敏感内容扫描
    PipelineSensitiveScan: "pipelinesensitivescan",
    //AnyBackup服务
    AnyBackup: "AnyBackupService",
    //产业大脑
    Industries: "Industries",

    LargeLanguageModelService: "LargeLanguageModelService",
};

/**
 * 服务名称
 */
export const ServicesText = {
    [Services.ManagementConsole]: __("AnyShare主模块"),
    [Services.OCR]: __("合合OCR内容识别服务"),
    [Services.Metadata]: __("扩展元数据服务"),
    [Services.KnowledgeCenter]: __("知识中心"),
    [Services.DocumentSet]: __("文档集服务"),
    [Services.AutoSheets]: __("智能表格"),
    [Services.Workflow]: __("Workflow 服务"),
    [Services.ECeph]: __("ECeph对象存储服务"),
    [Services.EAntivirus]: __("实时杀毒服务"),
    // [Services.InfoInsight]: __("InfoInsight"),
    [Services.NasGateway]: __("NAS Gateway 服务"),
    [Services.EgressPackage]: __("外发包功能"),
    [Services.ContentAnalysis]: __("内容分析及检索高级服务"),
    [Services.EncryptionMicroservice]: __("加解密功能"),
    [Services.WpsCore]: __("WPS Online 在线编辑与预览服务"),
    [Services.WpsOnline]: __("WPS Online 在线编辑与预览服务"),
    [Services.YOZOOffice]: __("永中Office在线编辑服务"),
    [Services.NearbyContentProcessing]: __("内容就近处理服务"),
    [Services.OfficeOnline]: __("Office Online 在线编辑与预览服务"),
    [Services.AnyDATA]: __("AnyDATA"),
    [Services.Observability]: __("AnyRobot Embedded 5"),
    [Services.VamtooDLPService]: __("华途数据安全集成服务"),
    [Services.EsafenetDLPService]: __("亿赛通数据安全集成服务"),
    [Services.SAPIntelligentContentManagement]: __("SAP智能内容管理服务"),
    [Services.IPGuardDLPService]: __("IP Guard数据安全集成服务"),
    [Services.AnyFabric]: __("AnyFabric 主模块"),
    [Services.SkyGuard]: __("天空卫士数据安全集成服务"),
    [Services.PipelineSensitiveScan]: __("敏感数据扫描功能"),
    [Services.AnyBackup]: __("AnyBackup"),
    [Services.Industries]: __("产业大脑"),
    [Services.LargeLanguageModelService]: __("大语言模型服务"),
};

/**
 * 通过服务获取服务类型
 * @param service 服务
 * @returns 服务类型
 */
export const service2ServiceType = (service: string) => {
    switch (service) {
        // 产品
        case Services.AnyDATA:
        case Services.Observability:
        case Services.ManagementConsole:
        case Services.AnyFabric:
            return ServicesType.Product;
        // 子产品
        case Services.AutoSheets:
        case Services.KnowledgeCenter:
        case Services.Industries:
            return ServicesType.SubProduct;
        // 内容服务
        case Services.Metadata:
        case Services.Workflow:
        case Services.ContentAnalysis:
        case Services.SAPIntelligentContentManagement:
        case Services.LargeLanguageModelService:
            return ServicesType.ContentService;
        // 第三方内容服务
        case Services.EAntivirus:
        case Services.WpsCore:
        case Services.WpsOnline:
        case Services.EsafenetDLPService:
        case Services.VamtooDLPService:
        case Services.OCR:
        case Services.YOZOOffice:
        case Services.IPGuardDLPService:
        case Services.SkyGuard:
            return ServicesType.ThridContentService;
        case Services.DocumentSet:
        case Services.ECeph:
        case Services.NasGateway:
        case Services.EgressPackage:
        case Services.EncryptionMicroservice:
        case Services.NearbyContentProcessing:
        case Services.OfficeOnline:
        case Services.PipelineSensitiveScan:
            return "";
        default:
            return "";
    }
};

export const SubProductCollection = [
    Services.AutoSheets,
    Services.KnowledgeCenter,
    Services.Industries,
];

/**
 * 应用类型
 */
export const AppType = {
    // app
    App: "app",
    // oss
    OSS: "oss",
};

@urlDecorator("/api/deploy-manager/v1/access-addr")
class AccessAddr {
    url: string;

    /**
     * 应用类型
     * @param type 类型
     */
    async get(type: string): Promise<AccessAddress> {
        return request.get(`${this.url}/${type}`);
    }
}

export const accessAddr = new AccessAddr();

/**
 * 客户端类型
 */
export enum OsType {
    /**
     * 安卓
     */
    Android = "android",

    /**
     * mac
     */
    Mac = "mac",

    /**
     * win32 advanced
     */
    Win32Advanced = "win32_advanced",

    /**
     * win64 advanced
     */
    Win64Advanced = "win64_advanced",

    /**
     * office 插件
     */
    officePlugin = "office_plugin",
    OfficePluginX86 = "officeplugin_x86",
    OfficePluginX64 = "officeplugin_x64",
    OfficePluginMac = "officeplugin_mac",

    /**
     * iOS
     */
    iOS = "ios",

    /**
     * windows
     */
    Windows = "windows",

    /**
     * linux_x64
     */
    LinuxX64AppImage = "linux_x64_AppImage",
    LinuxX64Rpm = "linux_x64_rpm",
    LinuxX64Deb = "linux_x64_deb",

    /**
     * linux_arm64
     */
    LinuxArm64AppImage = "linux_arm64_AppImage",
    LinuxArm64Rpm = "linux_arm64_rpm",
    LinuxArm64Deb = "linux_arm64_deb",

    /**
     * linux_mips64
     */
    LinuxMips64Rpm = "linux_mips64_rpm",
    LinuxMips64Deb = "linux_mips64_deb",
}

export const OSList = [
    OsType.Win32Advanced,
    OsType.Win64Advanced,
    OsType.LinuxArm64AppImage,
    OsType.LinuxArm64Deb,
    OsType.LinuxArm64Rpm,
    OsType.LinuxX64AppImage,
    OsType.LinuxX64Deb,
    OsType.LinuxX64Rpm,
    OsType.LinuxMips64Rpm,
    OsType.LinuxMips64Deb,
    OsType.Mac,
    OsType.iOS,
    OsType.Android,
    OsType.OfficePluginX86,
    OsType.OfficePluginX64,
    OsType.OfficePluginMac,
];
