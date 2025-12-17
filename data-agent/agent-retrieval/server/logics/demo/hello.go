package demo

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
)

type demoHelloServiceImpl struct {
	Logger interfaces.Logger
}

var (
	demoHelloOnce sync.Once
	dh            interfaces.IDemoHelloService
)

func NewDemoHelloService() interfaces.IDemoHelloService {
	demoHelloOnce.Do(func() {
		dh = &demoHelloServiceImpl{
			Logger: config.NewConfigLoader().GetLogger(),
		}
	})
	return dh
}

func (d *demoHelloServiceImpl) Hello() (result string) {
	return "hello world"
}
