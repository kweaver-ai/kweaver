package businessdomain

import (
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/usermgnt"
)

// BusinessDomainServiceInterface 定义了业务域服务的接口
// 这是从 BusinessDomainService 结构体中提取的公共方法接口

type BusinessDomainServiceInterface interface {
	// SetToken 设置认证令牌
	SetToken(token string) *BusinessDomainService

	// SetLogOperator 设置审计日志操作者
	SetLogOperator(o *auditlog.Toperator) *BusinessDomainService

	// Create 创建新的业务域
	Create(u *usermgnt.UserInfo, obj *BusinessDomainObject) (string, error)

	// Get 获取指定业务域的详细信息
	Get(u *usermgnt.UserInfo, bdid string) (*BusinessDomainObject, error)

	// List 获取业务域列表
	List(u *usermgnt.UserInfo) ([]*BusinessDomainObject, error)

	// ResourceTypeInstanceList 获取资源类型实例列表，支持分页和关键词搜索
	ResourceTypeInstanceList(limit, offset int, keyword string) ([]*BusinessDomainObject, int64, error)

	// Edit 编辑业务域信息
	Edit(u *usermgnt.UserInfo, bdid string, obj *BusinessDomainObject) error

	// Delete 删除业务域
	Delete(u *usermgnt.UserInfo, bdid string) error

	// MemberEdit 编辑业务域成员
	MemberEdit(u *usermgnt.UserInfo, bdid string, add, update, remove []BusinessDomainMemberObject) error

	// MemberList 获取业务域成员列表
	MemberList(u *usermgnt.UserInfo, bdid string, limit, offset int) ([]*BusinessDomainMemberObject, int, error)
}
