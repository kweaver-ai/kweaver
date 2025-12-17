package ecoconfigaccess

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/ecoconfigaccess/ecoconfigdto"
	"github.com/pkg/errors"
)

func (access *ecoConfigHttpAcc) DocReindex(ctx context.Context, request []ecoconfigdto.ReindexReq) error {
	url := fmt.Sprintf("%s/api/ecoconfig/v2/reindex", access.privateAddress)

	headers := map[string]string{
		"Content-Type": "application/json",
	}
	code, data, err := access.client.PostNoUnmarshal(ctx, url, headers, request)
	if err != nil {
		access.logger.Errorf(fmt.Sprintf("[DocReindex] request uri %s err %s,  code %d, resp %s ", url, err, code, string(data)))
		return err
	}

	if code != http.StatusNoContent {
		err = errors.Wrap(err, fmt.Sprintf("[DocReindex] request failed with status %d", code))
		return err
	}
	return nil
}
