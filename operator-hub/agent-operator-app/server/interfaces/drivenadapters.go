package interfaces

//go:generate mockgen -source=drivenadapters.go -destination=../mocks/drivenadapters.go -package=mocks
import "context"

// AccountAuthContext 账户认证上下文
type AccountAuthContext struct {
	// AccountID 账户唯一标识符
	AccountID string `json:"account_id"`
	// AccountType 账户类型
	AccountType AccessorType `json:"account_type"`
	// Token信息
	TokenInfo *TokenInfo `json:"token_info"`
}

// VisitorType 访问者类型
type VisitorType string

// 访问者类型定义
const (
	RealName  VisitorType = "realname"  // 实名用户
	Anonymous VisitorType = "anonymous" // 匿名用户
	Business  VisitorType = "business"  // 应用账户
)

// ToAccessorType 转换为访问者类型
func (v VisitorType) ToAccessorType() AccessorType {
	switch v {
	case RealName:
		return AccessorTypeUser
	case Business:
		return AccessorTypeApp
	case Anonymous:
		return AccessorTypeAnonymous
	default:
		// 未知访问者类型，默认匿名用户
		return AccessorTypeAnonymous
	}
}

// AccessorType 访问类型
type AccessorType string

const (
	AccessorTypeUser       AccessorType = "user"       // 实名用户
	AccessorTypeDepartment AccessorType = "department" // 部门
	AccessorTypeGroup      AccessorType = "group"      // 组织
	AccessorTypeRole       AccessorType = "role"       // 角色
	AccessorTypeApp        AccessorType = "app"        // 应用账户
	AccessorTypeAnonymous  AccessorType = "anonymous"  // 匿名访问
)

// ToVisitorType 将AccessorType转换为VisitorType
func (a AccessorType) ToVisitorType() VisitorType {
	switch a {
	case AccessorTypeUser:
		return RealName
	case AccessorTypeApp:
		return Business
	case AccessorTypeAnonymous:
		return Anonymous
	case AccessorTypeDepartment, AccessorTypeGroup, AccessorTypeRole:
		return ""
	default:
		return ""
	}
}

// AccountType 登录账号类型
type AccountType int32

// 登录账号类型定义
const (
	Other  AccountType = 0
	IDCard AccountType = 1
)

const (
	// AccessedByUser 实名用户
	AccessedByUser string = "accessed_by_users"
	// AccessedByAnyOne 匿名用户
	AccessedByAnyOne string = "accessed_by_anyone"
)

// ClientType 设备类型
type ClientType int32

// ClientTypeMap 客户端类型表
var ClientTypeMap = map[ClientType]string{
	Unknown:      "unknown",
	IOS:          "ios",
	Android:      "android",
	WindowsPhone: "windows_phone",
	Windows:      "windows",
	MacOS:        "mac_os",
	Web:          "web",
	MobileWeb:    "mobile_web",
	Nas:          "nas",
	ConsoleWeb:   "console_web",
	DeployWeb:    "deploy_web",
	Linux:        "linux",
	APP:          "app",
}

// ReverseClientTypeMap 客户端类型字符串反查表
var ReverseClientTypeMap = map[string]ClientType{
	"unknown":       Unknown,
	"ios":           IOS,
	"android":       Android,
	"windows_phone": WindowsPhone,
	"windows":       Windows,
	"mac_os":        MacOS,
	"web":           Web,
	"mobile_web":    MobileWeb,
	"nas":           Nas,
	"console_web":   ConsoleWeb,
	"deploy_web":    DeployWeb,
	"linux":         Linux,
	"app":           APP,
}

// AccountTypeMap 账户类型表
var AccountTypeMap = map[AccountType]string{
	Other:  "other_category",
	IDCard: "id_card",
}

// ReverseAccountTypeMap 账户类型字符串反查表
var ReverseAccountTypeMap = map[string]AccountType{
	"other_category": Other,
	"id_card":        IDCard,
}

func (typ ClientType) String() string {
	str, ok := ClientTypeMap[typ]
	if !ok {
		str = ClientTypeMap[Unknown]
	}
	return str
}

// 设备类型定义
const (
	Unknown ClientType = iota
	IOS
	Android
	WindowsPhone
	Windows
	MacOS
	Web
	MobileWeb
	Nas
	ConsoleWeb
	DeployWeb
	Linux
	APP
)

// TokenInfo 授权验证信息
type TokenInfo struct {
	Active     bool        // 令牌状态
	VisitorID  string      // 访问者ID
	Scope      string      // 权限范围
	ClientID   string      // 客户端ID
	VisitorTyp VisitorType // 访问者类型
	// 以下字段只在visitorType=1，即实名用户时才存在
	LoginIP     string      // 登陆IP
	Udid        string      // 设备码
	AccountTyp  AccountType // 账户类型
	ClientTyp   ClientType  // 设备类型
	PhoneNumber string      // 匿名用户的电话号码
	VisitorName string      // 匿名外链，访问者的昵称
	MAC         string      // MAC地址
	UserAgent   string      // 代理信息
}

// Hydra 授权服务接口
type Hydra interface {
	Introspect(ctx context.Context, token string) (tokenInfo *TokenInfo, err error)
}

const (
	// DisplayName 用户显示名称
	DisplayName = "name"
)

// UserInfo 用户信息
type UserInfo struct {
	UserID      string   `json:"id"`    // 用户ID
	DisplayName string   `json:"name"`  // 用户显示名称
	Roles       []string `json:"roles"` // 用户角色列表
}

// UserManagement 用户管理接口
type UserManagement interface {
	GetUsersInfo(ctx context.Context, userIDs []string, fields []string) (infos []*UserInfo, err error)
}

type MCPExecuteToolRequest struct {
	Headers     map[string]string `json:"header"`
	Body        interface{}       `json:"body"`
	QueryParams map[string]string `json:"query"`
	PathParams  map[string]string `json:"path"`
}

type HTTPResponse struct {
	StatusCode int               `json:"status_code"` // 状态码
	Headers    map[string]string `json:"headers"`     // 响应头
	Body       interface{}       `json:"body"`        // 响应体
	Error      string            `json:"error"`       // 错误信息
	Duration   int64             `json:"duration_ms"` // 响应时间
}

type AgentOperatorIntegration interface {
	// ExecuteTool 执行MCP工具
	ExecuteTool(ctx context.Context, mcpToolID string, req *MCPExecuteToolRequest) (resp *HTTPResponse, err error)
}
