import cookie from "js-cookie";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import {
    home,
    client,
    license,
    siteManagement,
    personalization,
    environment,
    storage,
    server,
    accessConfiguration,
    domainAuthentication,
    accounts,
    thirdPartyAuthentication,
    thirdCertificate,
    anybackup,
    resource,
    clientsPush,
    clientManagement,
    licenseManagement,
    tokenAndFingerprint,
    processMonitor,
    userGroup,
    softwareRepository,
    loginVisit,
    serviceManagement,
    serviceDeploy,
    taskMonitor,
    anyRobot,
    userDepartment,
    appAccount,
    componentManagement,
    connectInfoManagement,
    suiteManagement,
    suiteDeploy,
    suiteTaskMonitor,
    systemSpaceManagement,
    systemSpaceAdmin,
    systemSpace,
} from "../../locale";
import { session } from "../mediator";
import { UserInfo } from "../../api/oauth/declare";
import { SystemRoleType } from "../roles";

const prefix = "deploy";
// 增加前缀
let customPrefix =
    cookie.get("X-Forwarded-Prefix") || session.get("X-Forwarded-Prefix") || "";
customPrefix = URLPrefixFormatter(customPrefix, URL_PREFIX_MODE.tail);

// 获取涉及deploy-mini的URI路径(套件管理和服务管理)
class DeployMiniPathname {
    get deployMiniCustomPrefix() {
        const deployMiniPrefix =
            cookie.get("X-Forwarded-Prefix") ||
            session.get("X-Forwarded-Prefix") ||
            "";
        return URLPrefixFormatter(deployMiniPrefix, URL_PREFIX_MODE.tail);
    }

    /**
     * 服务管理路径
     */
    get serviceManagementPathname() {
        return `${this.deployMiniCustomPrefix}/${prefix}/${space2connector(
            serviceManagement[2]
        )}`;
    }

    get serviceDeployPathname() {
        return `${this.serviceManagementPathname}/${space2connector(
            serviceDeploy[2]
        )}`;
    }

    get taskMonitorPathname() {
        return `${this.serviceManagementPathname}/${space2connector(
            taskMonitor[2]
        )}`;
    }
}

export const deployMiniPathname = new DeployMiniPathname();

/**
 * 格式化路径
 * @param str
 * @returns
 */
export function space2connector(str: string) {
    // 1. 清理特殊字符 2. 空格替换为连接符 3. 转小写
    return str.replace(/&/, "").replace(/\s+/g, "-").toLowerCase();
}

export const consolePath = "/console/";

export let defaultPathList = [`/${prefix}`, `/${prefix}/`];

export const homePathname = `${customPrefix}/${prefix}/${space2connector(
    home[2]
)}`;
export const identityAccessPathname = `${customPrefix}/${prefix}/${space2connector(
    userDepartment[2]
)}`;
export const systemSpaceManagementPathname = `${customPrefix}/${prefix}/${space2connector(
    systemSpaceManagement[2]
)}`;
export const clientManagementPathname = `${customPrefix}/${prefix}/${space2connector(
    clientManagement[2]
)}`;
export const suiteManagementPathname = `${customPrefix}/${prefix}/${space2connector(
    suiteManagement[2]
)}`;
// export const serviceManagementPathname = `${customPrefix}/${prefix}/${space2connector(
//     serviceManagement[2]
// )}`;
export const environmentPathname = `${customPrefix}/${prefix}/${space2connector(
    environment[2]
)}`;
export const licensePathname = `${customPrefix}/${prefix}/${space2connector(
    license[2]
)}`;
export const personalizationPathname = `${customPrefix}/${prefix}/${space2connector(
    personalization[2]
)}`;
export const anyRobotPathname = `${customPrefix}/${prefix}/${space2connector(
    anyRobot[2]
)}`;

// 身份和访问管理
export const userDepartmentPathname = `${identityAccessPathname}/${space2connector(
    accounts[2]
)}`;
export const dominPathname = `${identityAccessPathname}/${space2connector(
    domainAuthentication[2]
)}`;
export const thirdConfigPathname = `${identityAccessPathname}/${space2connector(
    thirdPartyAuthentication[2]
)}`;
export const userGroupPathname = `${identityAccessPathname}/${space2connector(
    userGroup[2]
)}`;
export const loginVisitPathname = `${identityAccessPathname}/${space2connector(
    loginVisit[2]
)}`;
export const appAccountPathname = `${identityAccessPathname}/${space2connector(
    appAccount[2]
)}`;

// 系统空间管理员管理
export const systemSpaceAdminPathname = `${systemSpaceManagementPathname}/${space2connector(
    systemSpaceAdmin[2]
)}`;
export const systemSpacePathname = `${systemSpaceManagementPathname}/${space2connector(
    systemSpace[2]
)}`;

// 客户端管理
export const clientPathname = `${clientManagementPathname}/${space2connector(
    client[2]
)}`;
export const anybackupPathname = `${clientManagementPathname}/${space2connector(
    anybackup[2]
)}`;

// AnyBackup superManager
export const resourcePathname = `${anybackupPathname}/${space2connector(
    resource[2]
)}`;
export const clientsPushPathname = `${anybackupPathname}/${space2connector(
    clientsPush[2]
)}`;
export const tokenAndFingerprintPathname = `${anybackupPathname}/${space2connector(
    tokenAndFingerprint[2]
)}`;
export const processMonitorPathname = `${anybackupPathname}/${space2connector(
    processMonitor[2]
)}`;
export const softwareRepositoryPathname = `${anybackupPathname}/${space2connector(
    softwareRepository[2]
)}`;
export const licenseManagementPathname = `${anybackupPathname}/${space2connector(
    licenseManagement[2]
)}`;

// 套件管理
export const suiteDeployPathname = `${suiteManagementPathname}/${space2connector(
    suiteDeploy[2]
)}`;
export const suiteTaskMonitorPathname = `${suiteManagementPathname}/${space2connector(
    suiteTaskMonitor[2]
)}`;

// 服务管理
// export const serviceDeployPathname = `${serviceManagementPathname}/${space2connector(
//     serviceDeploy[2]
// )}`;
// export const taskMonitorPathname = `${serviceManagementPathname}/${space2connector(
//     taskMonitor[2]
// )}`;

// 环境与资源
export const accessConfigurationPathname = `${environmentPathname}/${space2connector(
    accessConfiguration[2]
)}`;
export const connectInfoManagementPathname = `${environmentPathname}/${space2connector(
    connectInfoManagement[2]
)}`;
export const componentManagementPathname = `${environmentPathname}/${space2connector(
    componentManagement[2]
)}`;
export const storagePathname = `${environmentPathname}/${space2connector(
    storage[2]
)}`;
export const serverPathname = `${environmentPathname}/${space2connector(
    server[2]
)}`;
export const siteManagementPathname = `${environmentPathname}/${space2connector(
    siteManagement[2]
)}`;
export const thirdCertificatePathname = `${environmentPathname}/${space2connector(
    thirdCertificate[2]
)}`;

export const homePathList = [homePathname];

export const setupDefaultPath = function (cb: (path: string) => any) {
    defaultPathList = defaultPathList.map(cb);
};

export const getFirstPathname = (userInfo: UserInfo) => {
    if (
        userInfo?.user?.roles?.some((role: any) => {
            return [SystemRoleType.Supper, SystemRoleType.Admin].includes(
                role?.id
            );
        })
    ) {
        return `${customPrefix}/deploy/information-security/auth/user-org`;
    } else if (
        userInfo?.user?.roles?.some((role: any) => {
            return [SystemRoleType.Securit, SystemRoleType.OrgManager].includes(
                role?.id
            );
        })
    ) {
        return `${customPrefix}/deploy/information-security/auth/user-org`;
    } else {
        return `${customPrefix}/deploy/information-security/audit/auditlog`;
    }
};
