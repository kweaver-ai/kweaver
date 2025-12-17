package category

import (
	"context"
	_ "embed"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	jsoniter "github.com/json-iterator/go"
)

//go:embed init.json
var initJSONData []byte

func (h *categoryHandler) initData() {
	h.Logger.Infof("init category data start")
	confLoader := config.NewConfigLoader()
	if !confLoader.CategoryConfig.InitSwitch {
		h.Logger.Infof("init category data skip, initSwitch is false")
		return
	}
	// 使用嵌入的init.json文件数据
	initData := initJSONData
	var cfg []*interfaces.CreateCategoryReq
	err := jsoniter.Unmarshal(initData, &cfg)
	if err != nil {
		h.Logger.Errorf("unmarshal init.json file failed, err: %v", err)
		panic(err)
	}
	_, err = h.CategoryManager.BatchCreateCategory(context.Background(), cfg)
	if err != nil {
		h.Logger.Errorf("init category data failed, err: %v", err)
		panic(err)
	}
	h.Logger.Infof("init category data success")
}
