package interfaces

//go:generate mockgen -source=driveradapters.go -destination=../mocks/driveradapters.go -package=mocks
import "github.com/gin-gonic/gin"

// HTTPRouterInterface 路由公共接口
type HTTPRouterInterface interface {
	RegisterRouter(engine *gin.RouterGroup)
}
