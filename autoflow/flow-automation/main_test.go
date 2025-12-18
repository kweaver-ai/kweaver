package main

import (
	"context"
	"fmt"
	"testing"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	liberrors "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/errors"
	i18n "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/i18n"
)

func TestMain(t *testing.T) {

	i18n.InitI18nTranslator(common.MultiResourcePath)

	err := liberrors.NewPublicRestError(context.Background(), liberrors.PErrorInternalServerError,
		liberrors.PErrorInternalServerError,
		nil)
	fmt.Println(err)
}
