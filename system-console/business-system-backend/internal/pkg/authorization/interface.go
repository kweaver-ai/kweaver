package authorization

// AuthorizationInterface 定义授权服务接口
type AuthorizationInterface interface {
	// Health 健康检查
	Health() error

	// SetPublicToken 设置公开客户端的认证令牌
	SetPublicToken(token string) *Authorization

	// BDAddMembers 添加业务域成员
	BDAddMembers(bdid, bdname string, ms []*MemberInfo) error

	// BDRemoveMember 移除业务域成员
	BDRemoveMember(bdid, uid, utype string) error

	// BDResetMember 重置业务域成员
	BDResetMember(bdid string) error

	// BDGetMember 获取业务域成员列表
	BDGetMember(bdid string, limit, offset int) ([]MemberInfo, int, error)

	// BDChangeMemberRole 更改业务域成员角色
	BDChangeMemberRole(bdid, uid, utype, role string) error

	// RegisterBDType 注册业务域资源类型
	RegisterBDType() error

	// CheckBDMember 检查用户是否为业务域成员
	CheckBDMember(bdid, uid, utype string) ([]string, error)

	// GetMemberBDs 获取用户所属的业务域列表
	GetMemberBDs(uid, utype string) ([]string, error)
}

// 确保 Authorization 实现了 AuthorizationInterface
var _ AuthorizationInterface = (*Authorization)(nil)
