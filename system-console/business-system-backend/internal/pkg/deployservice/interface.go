package deployservice

// DeployServiceInterface 定义部署服务接口
type DeployServiceInterface interface {
	// Health 健康检查
	Health() error

	// Products 获取产品列表
	Products() (map[string]Product, error)
}

// 确保 DeployService 实现了 DeployServiceInterface
var _ DeployServiceInterface = (*DeployService)(nil)
