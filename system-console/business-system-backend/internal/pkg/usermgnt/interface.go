package usermgnt

// UserMgntInterface 定义用户管理服务接口
type UserMgntInterface interface {
	// Health 健康检查
	Health() error

	// UserInfo 获取用户信息
	UserInfo(uid string) (*UserInfo, error)
}

// 确保 UserMgnt 实现了 UserMgntInterface
var _ UserMgntInterface = (*UserMgnt)(nil)
