package hydra

// HydraInterface 定义 Hydra 服务接口
type HydraInterface interface {
	// Health 健康检查
	Health() error

	// Introspect 令牌内省
	Introspect(token string) (*TokenIntrospectInfo, error)
}

// 确保 Hydra 实现了 HydraInterface
var _ HydraInterface = (*Hydra)(nil)
