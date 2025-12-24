package businessdomain

import (
	"system-backend/internal/pkg/auditlog"
	"time"
)

type BusinessDomainMemberObject struct {
	Role       string
	ORole      string
	UID        string
	UType      string
	UName      string
	ParentDeps []any
}

type BusinessDomainCreatorInfo struct {
	ID   string
	Name string
}

type BusinessDomainObject struct {
	ID          string
	Name        string
	Description string
	Products    []string
	Members     []BusinessDomainMemberObject
	CreatorInfo BusinessDomainCreatorInfo
	CreateTime  time.Time
}

func (svc *BusinessDomainService) SetToken(token string) *BusinessDomainService {
	svc.cliAuthorization.SetPublicToken(token)
	return svc
}

func (svc *BusinessDomainService) SetLogOperator(o *auditlog.Toperator) *BusinessDomainService {
	svc.cliAuditLog.SetOperator(o)
	return svc
}
