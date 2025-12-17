package interfaces

//go:generate mockgen -source=interface.go -destination=../mocks/interface.go -package=mocks
import "context"

// App 应用接口
type App interface {
	Start() error
	Stop(context.Context)
}

type ResourceDeployType string

func (r ResourceDeployType) String() string {
	return string(r)
}
