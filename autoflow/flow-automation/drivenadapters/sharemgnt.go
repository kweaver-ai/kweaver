package drivenadapters

import (
	"context"
	"os"
	"strconv"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/tapi/sharemgnt"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/go-lib/tclient"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
)

//go:generate mockgen -package mock_drivenadapters -source ../drivenadapters/sharemgnt.go -destination ../tests/mock_drivenadapters/sharemgnt_mock.go

// ShareMgnt method interface
type ShareMgnt interface {
	// 给指定用户发送信息
	SendEmail(subject, content string, toEmailList []string) error

	// GetDocLimitIPs 获取文档库绑定的网段ip
	GetDocLimitIPs() ([]NetInfo, error)

	// GetDocLimitMStatus 文档访问控制状态
	GetDocLimitMStatus() (bool, error)

	// GetDocLimMDo 获取某ip下绑定的所有文档库信息
	GetDocLimMDocs(netID string) (map[string]DocInfo, error)

	GetCSFLevels() (map[string]int32, error)

	GetCSFLevelsMap() (map[int32]string, error)
}

// NetInfo IP信息
type NetInfo struct {
	IP         string `json:"ip"`
	SubNetMask string `json:"subNetMask"`
	ID         string `json:"id"`
}

// DocInfo doc信息
type DocInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	TypeName string `json:"typeName"`
}

type shareMgntSvc struct {
	host   string
	port   int
	logger commonLog.Logger
}

var (
	sharemgntOnce sync.Once
	s             ShareMgnt
)

// NewShareMgnt 创建sharemgnt处理对象
func NewShareMgnt() ShareMgnt {
	sharemgntOnce.Do(func() {
		port, err := strconv.Atoi(os.Getenv("ShareMgntPort"))
		if err != nil {
			return
		}
		s = &shareMgntSvc{
			host:   os.Getenv("ShareMgntHost"),
			port:   port,
			logger: commonLog.NewLogger(),
		}
	})
	return s
}

// SendEmail 给指定用户发送信息
func (s *shareMgntSvc) SendEmail(subject, content string, toEmailList []string) error {
	var (
		shareMgntClient *sharemgnt.NcTShareMgntClient
	)

	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, s.host, s.port)

	if err != nil {
		s.logger.Errorf("Create shareMgntClient error:%s ", err.Error())
		return err
	}

	defer func() {
		if transport != nil {
			transport.Close() //nolint
		}
	}()
	err = shareMgntClient.SMTP_SendEmail(context.Background(), toEmailList, subject, content)

	return err
}

// GetDocLimitIPs 获取文档库绑定的网段ip
func (s *shareMgntSvc) GetDocLimitIPs() ([]NetInfo, error) {
	var (
		shareMgntClient *sharemgnt.NcTShareMgntClient
		netInfo         []NetInfo
	)

	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, s.host, s.port)

	if err != nil {
		s.logger.Errorf("Create shareMgntClient error:%s ", err.Error())
		return netInfo, err
	}

	defer func() {
		if transport != nil {
			transport.Close() // nolint
		}
	}()
	ips, err := shareMgntClient.DocLimitm_GetNet(context.Background())
	if err != nil {
		s.logger.Errorf("Get DocLimitIPs error:%s ", err.Error())
		return netInfo, err
	}
	for _, v := range ips {
		ip := v
		netInfo = append(netInfo, NetInfo{
			IP:         ip.IP,
			SubNetMask: ip.SubNetMask,
			ID:         ip.ID,
		})
	}
	return netInfo, nil
}

// GetDocLimitMStatus 文档访问控制状态
func (s *shareMgntSvc) GetDocLimitMStatus() (bool, error) {
	var (
		shareMgntClient *sharemgnt.NcTShareMgntClient
		allow           bool
	)

	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, s.host, s.port)

	if err != nil {
		s.logger.Errorf("Create shareMgntClient error:%s ", err.Error())
		return allow, err
	}

	defer func() {
		if transport != nil {
			transport.Close() //nolint
		}
	}()
	allow, err = shareMgntClient.DocLimitm_GetStatus(context.Background())
	if err != nil {
		s.logger.Errorf("Get DocLimitM Status error:%s ", err.Error())
		return allow, err
	}
	return allow, nil
}

// GetDocLimMDo 获取某ip下绑定的所有文档库信息
func (s *shareMgntSvc) GetDocLimMDocs(netID string) (map[string]DocInfo, error) {
	var (
		shareMgntClient *sharemgnt.NcTShareMgntClient
		docInfo         = make(map[string]DocInfo)
	)

	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, s.host, s.port)

	if err != nil {
		s.logger.Errorf("Create shareMgntClient error:%s ", err.Error())
		return nil, err
	}

	defer func() {
		if transport != nil {
			transport.Close() //nolint
		}
	}()
	netDocInfo, err := shareMgntClient.DocLimitm_GetDocs(context.Background(), netID)
	if err != nil {
		s.logger.Errorf("Get DocLimitM Docs error:%s ", err.Error())
		return nil, err
	}
	for _, v := range netDocInfo {
		t := v
		docInfo[t.Name] = DocInfo{
			ID:       t.ID,
			Name:     t.Name,
			TypeName: t.TypeName,
		}
	}
	return docInfo, nil
}

func (s *shareMgntSvc) GetCSFLevels() (map[string]int32, error) {
	var (
		shareMgntClient *sharemgnt.NcTShareMgntClient
		csfInfo         = make(map[string]int32)
	)

	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, s.host, s.port)

	if err != nil {
		s.logger.Errorf("Create shareMgntClient error:%s ", err.Error())
		return nil, err
	}

	defer func() {
		if transport != nil {
			transport.Close() //nolint
		}
	}()

	csfInfo, err = shareMgntClient.GetCSFLevels(context.Background())

	if err != nil {
		s.logger.Errorf("GetCSFLevels error:%s ", err.Error())
		return nil, err
	}

	return csfInfo, nil
}

func (s *shareMgntSvc) GetCSFLevelsMap() (map[int32]string, error) {
	csfInfo, err := s.GetCSFLevels()
	if err != nil {
		return nil, err
	}
	csfMap := make(map[int32]string)
	for k, v := range csfInfo {
		csfMap[v] = k
	}
	return csfMap, nil
}
