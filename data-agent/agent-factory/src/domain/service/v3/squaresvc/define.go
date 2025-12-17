package squaresvc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/releaseacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/spacedb/spacedbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/visithistoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/httpaccess/usermanagementacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/port/driven/ihttpaccess/iumacc"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/ihttpaccess/iusermanagementacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
)

var (
	squareSvcOnce sync.Once
	squareSvcImpl iv3portdriver.ISquareSvc
)

type squareSvc struct {
	*service.SvcBase
	agentConfRepo            idbaccess.IDataAgentConfigRepo
	releaseRepo              idbaccess.IReleaseRepo
	releaseHistoryRepo       idbaccess.IReleaseHistoryRepo
	usermanagementHttpClient iusermanagementacc.UserMgnt
	visitHistoryRepo         idbaccess.IVisitHistoryRepo
	spaceRepo                idbaccess.ISpaceRepo

	umHttp iumacc.UmHttpAcc
}

var _ iv3portdriver.ISquareSvc = &squareSvc{}

func NewSquareService() iv3portdriver.ISquareSvc {
	squareSvcOnce.Do(func() {
		squareSvcImpl = &squareSvc{
			SvcBase:                  service.NewSvcBase(),
			releaseRepo:              releaseacc.NewReleaseRepo(),
			releaseHistoryRepo:       releaseacc.NewReleaseHistoryRepo(),
			agentConfRepo:            daconfdbacc.NewDataAgentRepo(),
			usermanagementHttpClient: usermanagementacc.NewClient(),
			visitHistoryRepo:         visithistoryacc.NewVisitHistoryRepo(),
			spaceRepo:                spacedbacc.NewSpaceRepo(),

			umHttp: chttpinject.NewUmHttpAcc(),
		}
	})

	return squareSvcImpl
}
