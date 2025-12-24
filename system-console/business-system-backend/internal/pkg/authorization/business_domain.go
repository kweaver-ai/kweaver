package authorization

import "fmt"

type (
	m          = map[string]any
	l          = []any
	MemberInfo struct {
		Role       string
		UID        string
		UType      string
		UName      string
		ParentDeps l
	}
)

const BDResourceTypeName = "business_domain"
const BDResourceTypeInstanceURL = "/api/business-system/v1/rt/bd"
const AuthorizePermission = "authorize"

var BDResourceTypeDefine = m{
	"name":         "业务域",
	"description":  "业务域资源类型",
	"instance_url": fmt.Sprintf("GET %s", BDResourceTypeInstanceURL),
	"data_struct":  "string",
	"hidden":       true,
	"operation": l{
		m{
			"id":          "administrator",
			"scope":       l{"instance"},
			"description": "管理员",
			"name": l{
				m{
					"language": "zh-cn",
					"value":    "管理员",
				},
			},
		},
		m{
			"id":          "developer",
			"scope":       l{"instance"},
			"description": "开发者",
			"name": l{
				m{
					"language": "zh-cn",
					"value":    "开发者",
				},
			},
		},
		m{
			"id":          AuthorizePermission,
			"scope":       l{"instance", "type"},
			"description": "授权管理",
			"name": l{
				m{
					"language": "zh-cn",
					"value":    "授权管理",
				},
			},
		},
	},
}
