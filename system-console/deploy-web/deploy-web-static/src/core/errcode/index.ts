import { ErrorCode } from "./errcode";
import __ from "./locale";

/**
 * 操作类型
 */
enum OpType {
    // 全部
    ALL,

    // 下载
    DOWNLOAD,

    // 上传
    UPLOAD,

    // 收藏
    COLLECT,
}

// 异常码对应中文描述，用于在国际化资源中查找对应信息
// 国际化资源需要在locale中定义
const ErrorKeyHash = {
    [ErrorCode.URINotExists]: "不支持的接口",
    [ErrorCode.ParametersIllegal]: "非法参数",
    [ErrorCode.PermConfigIllegal]: "非法权限值类型",
    [ErrorCode.AccessorIllegal]: "非法访问者类型",
    [ErrorCode.ChunkMismatched]: "数据块大小和实际大小不匹配",
    [ErrorCode.SearchCharacterIllegal]: "全文检索语法错误，特殊字符或错误编码",
    [ErrorCode.SearchParameterInvalid]: "全文检索请求查询的参数无效",
    [ErrorCode.LocalTimeInvalid]:
        "您设置的时间已经早于服务器的当前时间，请重新设置或校对时间。",
    [ErrorCode.ExpirationInvalid]:
        "您设置的有效期已经超过了5年的限制，请重新设置或校对时间。",
    [ErrorCode.NameInvalid]:
        '标签名不能包含 / : * ? " < > | 特殊字符，请重新输入',
    [ErrorCode.PermConfigExpired]:
        "您设置的权限有效期限已经早于服务器的当前时间，请重新设置或校对时间。",
    [ErrorCode.LinkConfigExpired]:
        "您设置的链接有效期限已经早于服务器的当前时间，请重新设置或校对时间。",
    [ErrorCode.TokenExpired]: "登录已超时",
    [ErrorCode.LinkAuthFailed]: "HTTPLink密码不正确",
    [ErrorCode.AuthFailed]: "账号或密码不正确。",
    [ErrorCode.UserDisabled]: "账号已被禁用。",
    [ErrorCode.EncryptionInvalid]: "加密凭证无效",
    [ErrorCode.AdminLoginFailed]: "您是管理员角色，无法登录Web客户端。",
    [ErrorCode.DomainDisabled]: "域用户所属的域已被禁用或删除",
    [ErrorCode.UserNotInDomain]: "用户不存在于域控中",
    [ErrorCode.DeviceBinded]: "该账号已绑定设备，无法登录Web端。",
    [ErrorCode.PasswordFailure]: "您的登录密码已失效，是否立即修改密码？",
    [ErrorCode.PasswordInsecure]: "您的密码安全系数过低，是否立即修改密码？",
    [ErrorCode.PasswordInvalid]:
        "新密码格式不正确，请输入10-32个字符，且只能包含大小写字母、数字及~`!@#$%-_,.特殊字符",
    [ErrorCode.PasswordWeak]:
        "新密码格式不正确，请输入10-32个字符，需同时包含大小写字母及数字，支持~`!@#$%-_,.特殊字符",
    [ErrorCode.PasswordChangeNotSupported]:
        "当前用户为外部用户，不支持修改密码",
    [ErrorCode.PasswordIsInitial]: "无法使用初始密码登录，是否立即修改密码？",
    [ErrorCode.PasswordInvalidOnce]:
        "您已输错1次密码，连续输错3次将导致账号被锁定。",
    [ErrorCode.PasswordInvalidTwice]:
        "您已输错2次密码，连续输错3次将导致账号被锁定。",
    [ErrorCode.PasswordInvalidLocked]:
        "您输入错误次数超过限制，账号已被锁定，1小时内无法登录，请稍后重试。",
    [ErrorCode.PasswordRestricted]: "您没有权限修改密码，请联系管理员。",
    [ErrorCode.LicenseInvalid]: "当前产品未经授权，您无法登录，请联系管理员。",
    [ErrorCode.DomainServerUnavailable]:
        "连接LDAP服务器失败，请检查域控ip是否正确，或者域控制器是否开启！",
    [ErrorCode.AccountDuplicatedLogin]: "当前帐号在另一地点登录，您被迫下线！",
    [ErrorCode.PasswordExpired]: "您的密码已过期, 请联系管理员。",
    [ErrorCode.LoginSiteInvalid]: "当前站点为分站点模式，无法登录。",
    [ErrorCode.LicenseExpired]: "产品授权已过期，您无法登录，请联系管理员。",
    [ErrorCode.LinkVisitExceeded]: "抱歉，您的打开次数已达上限！",
    [ErrorCode.IPRestricted]: "您受到IP 网段限制，无法登录，请联系管理员。",
    [ErrorCode.AccountLocked]:
        "您输入错误次数超过限制，账号已被锁定，请联系安全管理员。",
    [ErrorCode.ClientRestricted]: "管理员已禁止此类客户端登录。",
    [ErrorCode.NewPasswordIsInitial]: "新密码不能为初始密码。",
    [ErrorCode.NetworkChanged]: "您所在的网络环境已改变，请重新登录。",
    [ErrorCode.VCodeMissing]: "验证码不能为空，请重新输入。",
    [ErrorCode.VCodeExpired]: "验证码已过期，请重新输入。",
    [ErrorCode.VCodeInvalid]: "验证码不正确，请重新输入。",
    [ErrorCode.PhoneNumberInvalid]: "手机号有误。",
    [ErrorCode.PhoneNumberDuplicated]: "该手机号已被占用。",
    [ErrorCode.UnboundEmail]: "该邮箱未绑定。",
    [ErrorCode.UnboundPhone]: "该手机号未绑定。",
    [ErrorCode.VcodeErrorTimesTooMany]: "验证码错误次数过多，请重新发送。",
    [ErrorCode.QuotaExhausted]: "目标位置的配额空间不足。",
    [ErrorCode.PermissionRestricted]: (opType: OpType) => {
        switch (opType) {
            case OpType.ALL:
                return "没有权限执行此操作。";

            case OpType.DOWNLOAD:
                return "您没有下载权限。";

            case OpType.UPLOAD:
                return "您没有上传权限。";

            case OpType.COLLECT:
                return "无法执行收藏操作，您对文件“${filename}”没有显示权限。";
        }
    },
    [ErrorCode.OwnershipRestricted]: "只有文档所有者才能进行该操作",
    [ErrorCode.OwnershipTypeError]: "个人文档不能设置所有者",
    [ErrorCode.SelfOwnershipRestricted]: "不能添加自己或设置管理员为所有者",
    [ErrorCode.SelfDeOwnershipRestricted]: "不能删除自己的所有者配置",
    [ErrorCode.GroupCountLimited]: "个人创建的群组个数不能超过3个",
    [ErrorCode.PermissionAccessorInaccessible]: "配权限时，访问者不存在",
    [ErrorCode.PersonalQuotaZero]: "个人空间配额不能设置为0",
    [ErrorCode.GroupNameDuplicated]: "该名称已被占用，请重新输入",
    [ErrorCode.OwnershipAccessorInaccessible]: "配所有者时，指定用户不存在",
    [ErrorCode.AccessorDuplicated]: "用户已经存在",
    [ErrorCode.LinkDuplicated]: "HTTPLink已经存在",
    [ErrorCode.WriteCompleteReversion]: "不能向完整版本添加数据块",
    [ErrorCode.ObjectTypeError]: "操作的对象类型不正确",
    [ErrorCode.RecycleDeleteInaccessible]: "不能删除不在回收站的文件或目录",
    [ErrorCode.RecycleRestoreInaccessible]: "不能还原不在回收站的文件或目录",
    [ErrorCode.DownloadReversionIncomplete]: "不能下载非完整的版本对象",
    [ErrorCode.PathInvalid]: "对象无法移动到相同的路径，或跨管理节点移动对象",
    [ErrorCode.PublicShareDuplicated]:
        "当前目录已经开启或关闭发现共享，导致操作失败",
    [ErrorCode.ParentPublicShareEnabled]:
        "父目录已经开启或关闭发现共享，导致操作失败",
    [ErrorCode.DocumentDeleteInaccessible]: "不能删除不存在的数据块",
    [ErrorCode.PreviewSizeExceeded]: "预览文档或缩略图过大，预览失败",
    [ErrorCode.GNSInvalid]: "管理对象不存在",
    [ErrorCode.SizeExceeded]: "请求内容超过对象大小",
    [ErrorCode.PreviewFormatInvalid]: "文档预览失败，格式错误",
    [ErrorCode.ThumbnailFormatInvalid]: "缩略图预览失败，格式错误",
    [ErrorCode.CASDisabled]: "第三方认证未开启",
    [ErrorCode.TicketInvalid]: "无法验证ticket",
    [ErrorCode.UserNotFound]: "该用户未导入到AnyShare系统中",
    [ErrorCode.FullnameDuplicated]: "已存在同类型的同名文档",
    [ErrorCode.NameDuplicatedReadonly]:
        "存在与当前文件“${filename}”同名的文件但无修改权限",
    [ErrorCode.DiffTypeNameDuplicated]:
        "与当前文件“${filename}”同名的是一个文件夹。",
    [ErrorCode.TrancodeFormatUnsupported]: "转码失败，文件格式不支持",
    [ErrorCode.PermissionMismath]: "没有权限操作目标位置的对象",
    [ErrorCode.LinkRestricted]: "您没有HTTP共享权限，请联系管理员。",
    [ErrorCode.CSFLevelMismatch]: "您的密级不足。",
    [ErrorCode.TranscodeSpaceExhausted]: "转码失败，服务器缓存空间不足",
    [ErrorCode.DocumentSizeExceeded]:
        "文件“${filename}”过大，无法同步，您所在的网络存在限制。",
    [ErrorCode.ApplyAuditMissing]:
        "当前无匹配的审核员，本次操作无法生效，请联系管理员。",
    [ErrorCode.ShareApplyComplete]: "此条记录已失效或被其他审核员审核完成。",
    [ErrorCode.ShareApplyInvalid]: "您的审核权限已失效。",
    [ErrorCode.ShareApplyAccessorInaccessible]:
        "此条申请已经失效（访问者已经被删除）",
    [ErrorCode.ApplyDenyConcentMissing]: "否决申请时，内容不能为空",
    [ErrorCode.ShareApplySharerInaccessible]:
        "此条申请已失效（共享者已经被删除）",
    [ErrorCode.ShareApplySharerInaccessible2]:
        "此条申请已失效（授权者已经被删除）",
    [ErrorCode.ShareApplyExpired]: "此条申请已失效（截止时间已经过期）",
    [ErrorCode.LinkApplyInvalid]: "此条申请已失效（HTTPLink已失效）",
    [ErrorCode.LinkApplyDuplicated]: "此条申请已失效（HTTPLink已存在）",
    [ErrorCode.AuditCSFMismatch]:
        "当前审核员密级不足，本次操作无法生效，请联系管理员。",
    [ErrorCode.InsufficientCSFLevel]: "您的密级不足。",
    [ErrorCode.ArchiveModificationRestriced]: "您无法修改归档库的文件。",
    [ErrorCode.InvitationDuplicated]: "共享邀请链接已存在。",
    [ErrorCode.InvitationExcluded]: "您不在共享范围内，无法加入。",
    [ErrorCode.InvitationDisabled]: "共享邀请链接功能未开启。",
    [ErrorCode.InvitationRestricted]: "涉密和共享审核模式下不允许邀请加入。",
    [ErrorCode.ShareExpirationExpired]:
        "您设置的权限有效期限已经早于服务器的当前时间，请重新设置或校对时间。",
    [ErrorCode.LinkExpirationExpired]:
        "您设置的链接有效期限已经早于服务器的当前时间，请重新设置或校对时间。",
    [ErrorCode.LinkExpirationConflict]: "链接有效期限不能大于权限有效期限。",
    [ErrorCode.CommentSubmitDisabled]:
        "发表失败，评论功能没有正常启用，请联系管理员。",
    [ErrorCode.CommentDeleteDisabled]:
        "删除失败，评论功能没有正常启用，请联系管理员。",
    [ErrorCode.CommentSubmitDuplicated]: "发表失败，不能对同一文件重复评分。",
    [ErrorCode.CommentDeleteUnauthorized]: "删除失败，只能删除自己发表的评论。",
    [ErrorCode.DownloadExceeded]: "无法执行下载操作，您的下载次数超出限制",
    [ErrorCode.PersonalShareUnauthorized]: "您没有共享个人文档库的权限。",
    [ErrorCode.GroupShareUnauthorized]: "您没有共享群组文档库的权限。",
    [ErrorCode.PersonalInvitationUnauthorized]:
        "您没有共享个人文档库的权限，无法开启共享邀请。",
    [ErrorCode.GroupInvitationUnauthorized]:
        "您没有共享群组文档库的权限，无法开启共享邀请。",
    [ErrorCode.PersonLinkUnauthorized]:
        "您没有共享个人文档库的权限，无法开启HTTPLink。",
    [ErrorCode.GroupLinkUnauthorized]:
        "您没有共享群组文档库的权限，无法开启HTTPLink。",
    [ErrorCode.PersonLinkModificationUnauthorized]:
        "您没有共享个人文档库的权限，无法修改HTTP共享。",
    [ErrorCode.GroupLinkModificationUnathorized]:
        "您没有共享群组文档库的权限，无法修改HTTP共享。",
    [ErrorCode.PersonalInvitationModificationUnauthorized]:
        "您没有共享个人文档库的权限，无法修改共享邀请。",
    [ErrorCode.GroupInvitationModificationUnauthorized]:
        "您没有共享群组文档库的权限，无法修改共享邀请。",
    [ErrorCode.AccountFrozen]: "您的账号已被冻结。",
    [ErrorCode.DocumentFrozen]: "该文档已被冻结。",
    [ErrorCode.NoAntivirus]: "正在扫描病毒，请稍后再试。",
    [ErrorCode.GroupInaccessible]: "群组不存在",
    [ErrorCode.DeparmentInaccessible]:
        "获取子部门或子用户信息时，指定部门不存在",
    [ErrorCode.ParentObjectInaccessible]: "父对象不存在",
    [ErrorCode.UserInfoInaccessible]: "获取用户信息时，用户不存在",
    [ErrorCode.EntrydocInaccessible]: "入口文档记录不存在",
    [ErrorCode.GNSInaccessible]:
        "文件或文件夹“${filename}”不存在, 可能其所在路径发生变更。",
    [ErrorCode.LinkInaccessable]: "HTTPLink已失效。",
    [ErrorCode.DataChunkInaccessible]: "请求对应数据块不存在",
    [ErrorCode.ReversionIncomplete]: "没有完整的版本",
    [ErrorCode.DataChunkIncomplete]: "数据块信息不完整",
    [ErrorCode.MailtoFormatInvalid]: "邮箱收件人格式不正确，请重新输入。",
    [ErrorCode.SMTPConfigMissing]: "SMTP服务器未设置，请联系管理员。",
    [ErrorCode.SMTPUnknownError]: "SMTP服务器存在未知错误，请联系管理员。",
    [ErrorCode.SMTPInaccessible]: "SMTP服务器不可用，请联系管理员。",
    [ErrorCode.DocumentInaccessible]: "文档不存在。",
    [ErrorCode.InvitationInaccessible]: "共享邀请链接不存在。",
    [ErrorCode.OwnerMissing]: "文档所有者不存在。",
    [ErrorCode.SendVcodeServerUnavailable]: "发送验证码服务器未开启。",
    [ErrorCode.SMSPConfigMissing]: "短信服务器未设置，请联系管理员。",
    [ErrorCode.HTTPMethodError]: "HTTP方法错误",
    [ErrorCode.InternalError]: "内部错误",
    [ErrorCode.PreviewFailed]: "预览文件或缩略图失败",
    [ErrorCode.StorageUninitialized]: "存储适配层未初始化",
    [ErrorCode.DataCorrupted]: "数据已经损坏",
    [ErrorCode.MetadataCorrupted]: "元数据已损坏",
    [ErrorCode.DataIncompatibale]: "程序与当前数据不兼容",
    [ErrorCode.ServerClientMismatch]: "服务器版本不支持该客户端",
    [ErrorCode.SearchEngineIndexFailed]: "全文检索链接索引服务器失败",
    [ErrorCode.SearchEngineInternalError]: "全文检索索引服务器内部错误",
    [ErrorCode.SearchEngineNotInstalled]: "全文检索未安装",
    [ErrorCode.HTTPNotPOST]: "不支持除POST外的其它方法",
    [ErrorCode.ServiceBusy]: "服务器繁忙",
    [ErrorCode.DocumentConverting]: "文档或缩略图正在转换",
    [ErrorCode.WatermarkProcessing]: "正在制作水印，请稍后再试",
    [ErrorCode.SmallQuota]: "配额空间不能小于已用空间${used}，请重新输入。",
    [ErrorCode.NotNullGroup]:
        "当前群组文档中存有数据，请先将其迁移后再进行删除操作。",
    [ErrorCode.GroupNameInvalid]:
        '群组名不合法，可能字符过长或包含  / : * ? " < > | 特殊字符。',
    [ErrorCode.UserdocMissing]: "您的个人文档库已被关闭，无法使用此功能。",
    [ErrorCode.ResourcesNotEnough]: "服务器资源不足，无法访问。",
    [ErrorCode.EmailInvalid]:
        "邮箱地址只能包含 英文、数字 及 @-_. 字符，格式形如 XXX@XXX.XXX，长度范围 5~100 个字符，请重新输入。",
    [ErrorCode.EmailDuplicated]: "该邮箱已被占用",
    [ErrorCode.ExtLoginFailed]: "登录外部应用失败",
    [ErrorCode.NeedAction]: "用户已被禁用，是否立即激活？",
    [ErrorCode.UserActivated]: "用户已被激活，请到登录页登录",
    [ErrorCode.SendCaprchaFail]: "发送验证码失败",
    [ErrorCode.NotOpenActivated]: "短信激活未开启",
    [ErrorCode.FailActivated]: "激活失败",
    [ErrorCode.DeleteOutboxDisabled]:
        "无法执行重命名操作。您没有对发送文件箱目录的操作权限。",
    [ErrorCode.WorkflowApplicationInvalid]: "该流程申请已失效。",
    [ErrorCode.WorkFlowCommentsOverWords]:
        "审核流程失败，补充说明不能超过1024个字节。",
    [ErrorCode.IDAuthDisabled]: "管理员已关闭身份证号登录，请重新登录。",
    [ErrorCode.ReceivingSiteNotExist]: "接收站点不存在。",
    [ErrorCode.ContactNotExist]: "联系人不存在",
    [ErrorCode.UserNotExist]: "用户不存在",
    [ErrorCode.ContactGroupNotExist]: "联系人分组不存在",
    [ErrorCode.DispalyNameNull]: "显示名不能为空",
    [ErrorCode.DisplayNameInvalid]:
        '显示名不合法，可能字符过长或包含 \\ / : * ? " < > | 特殊字符，请重新输入。',
    [ErrorCode.DisplayNameDuplicated]: "该显示名已被占用，请重新输入。",
    [ErrorCode.ThirdPartyValidateFail]:
        "第三方验证失败，请检查第三方服务器是否开启!",
    [ErrorCode.AttrNotExist]: "无法执行此操作，可能某个编目已被管理员删除。",
    [ErrorCode.PhoneNotUnbound]:
        "管理员已开启短信身份验证，您尚未绑定手机，无法发送验证码，请联系管理员。",
    [ErrorCode.SMSServerExceptions]:
        "管理员已开启短信身份验证，但短信服务器异常，无法发送验证码，请联系管理员。",
    [ErrorCode.SMSServerNotEnabled]:
        "发送失败，可能短信服务器未正常启用，请联系管理员。",
    [ErrorCode.OTPServerExceptions]: "动态密码服务异常，请联系管理员。",
    [ErrorCode.OTPServerNotEnabled]: "动态密码服务器未设置，请联系管理员。",
    [ErrorCode.OTPInvalid]: "动态密码不正确，请重新输入。",
    [ErrorCode.OTPRequest]: "动态密码不能为空，请重新输入。",
    [ErrorCode.PhoneModified]:
        "发送失败，您绑定的手机号发生变更，请返回登录重试。",
    [ErrorCode.OTPExpired]: "动态密码已过期，请重新输入。",
    [ErrorCode.OTPErrorTimesTooMany]: "动态密码错误次数过多，请重新获取。",
    [ErrorCode.AuthServerExceptions]: "多因子认证配置错误。",
    [ErrorCode.ThridServerImportError]: "第三方插件导入失败。",
};

/**
 * 通过errcode查找资源文件的Key
 * @param errcode 异常码
 * @param optype 操作类型
 * @return 返回异常信息的Key
 */
function findLocale(errcode: number, ...params: any[]) {
    let match = ErrorKeyHash[errcode];
    if (!match) {
        return "未知的错误码";
    } else if (typeof match === "string") {
        return match;
    } else if (typeof match === "function") {
        return match(...params);
    }
}

/**
 * 获取异常提示模版
 * @param errcode 异常码
 * @param optype 操作类型
 * @return 返回异常提示模版函数
 */
export function getErrorTemplate(errcode: number, ...params: any[]) {
    return function (args: any) {
        return __(findLocale(errcode, ...params), args);
    };
}

/**
 * 根据异常码获取异常提示
 * @param errcode 异常码
 * @param args 模版填充信息
 * @return 返回异常提示信息
 */
export function getErrorMessage(errcode: number, ...params: any[]): string {
    return __(findLocale(errcode, ...params)) || "";
}
