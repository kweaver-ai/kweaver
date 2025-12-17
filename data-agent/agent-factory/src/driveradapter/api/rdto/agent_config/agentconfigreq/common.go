package agentconfigreq

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/daconfeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum/agentconfigenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"github.com/pkg/errors"
)

// d2eGenAllowedFileTypes 根据TempZoneConfig生成allowed_file_types
func d2eGenAllowedFileTypes(config *daconfvalobj.Config) (err error) {
	if config.Input.TempZoneConfig != nil {
		err = config.Input.TempZoneConfig.GenAllowedFileTypes()
		if err != nil {
			err = errors.Wrap(err, "[UpdateReq]: GenAllowedFileTypes failed")
			return
		}
	}

	return
}

func setDefaultValue(config *daconfvalobj.Config) {
	// 1. 给TempZoneConfig设置默认值
	tempZoneConfig := config.Input.TempZoneConfig

	if tempZoneConfig != nil {
		if tempZoneConfig.MaxFileCount == nil {
			maxFileCount := 50
			tempZoneConfig.MaxFileCount = &maxFileCount
		}

		if tempZoneConfig.Name == "" {
			tempZoneConfig.Name = "临时区"
		}

		if tempZoneConfig.SingleChatMaxSelectFileCount == nil {
			singleChatMaxSelectFileCount := 5
			tempZoneConfig.SingleChatMaxSelectFileCount = &singleChatMaxSelectFileCount
		}
	}

	// 2. 给metaData设置默认值
	if config.GetConfigMetadata().GetConfigTplVersion() == "" {
		config.GetConfigMetadata().SetConfigTplVersion(agentconfigenum.ConfigTplVersionV1)
	}
}

func HandleConfig(config *daconfvalobj.Config) (err error) {
	// 1. 生成allowed_file_types
	err = d2eGenAllowedFileTypes(config)
	if err != nil {
		return
	}

	// 2. set is_temp_zone_enabled
	config.Input.SetIsTempZoneEnabled()

	// 3. 设置默认值
	setDefaultValue(config)

	// 4. 清除ds_doc的datasets
	// 创建和编辑时，不需要通过接口来传递这个，这里置空。后面会有逻辑给这个赋值
	config.ClearDsDocDatasets()

	return
}

func D2eCommonAfterD2e(eo *daconfeo.DataAgent) {
	// 1. 设置Config.Metadata.ConfigLastSetTimestamp
	eo.Config.Metadata.SetConfigLastSetTimestamp()
}
