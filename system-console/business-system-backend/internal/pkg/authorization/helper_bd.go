package authorization

import (
	"fmt"
	"net/url"
	"strings"
	"system-backend/internal/model"

	"github.com/duke-git/lancet/v2/slice"
)

func (a *Authorization) BDAddMembers(bdid, bdname string, ms []*MemberInfo) error {

	body := slice.Map(ms, func(_ int, item *MemberInfo) m {
		return m{
			"accessor": m{
				"id":   item.UID,
				"type": item.UType,
			},
			"resource": m{
				"id":   bdid,
				"name": bdname,
				"type": BDResourceTypeName,
			},
			"operation": m{
				"allow": role2opts(item.Role),
				"deny":  l{},
			},
		}
	})
	resp, err := a.private.R().
		SetBody(body).
		SetError(stdErr{}).
		Post("/api/authorization/v1/policy")
	if err := a.errorFor(resp, err, "create accessor policies"); err != nil {
		return err
	}
	return nil
}

func (a *Authorization) BDRemoveMember(bdid, uid, utype string) error {
	var result struct {
		Entries    []m `json:"entries"`
		TotalCount int `json:"total_count"`
	}
	resp, err := a.public.R().SetQueryParams(map[string]string{
		"accessor_id":   uid,
		"accessor_type": utype,
		"resource_id":   bdid,
		"resource_type": BDResourceTypeName,
	}).SetResult(&result).Get("/api/authorization/v1/accessor-policy")

	if err := a.errorFor(resp, err, "remove accessor policy"); err != nil {
		return err
	}

	if result.TotalCount > 0 {
		policyIDs := make([]string, 0, result.TotalCount)
		for _, entry := range result.Entries {
			policyIDs = append(policyIDs, entry["id"].(string))
		}
		resp, err := a.public.R().Delete(fmt.Sprintf(
			"/api/authorization/v1/policy/%s",
			url.PathEscape(strings.Join(policyIDs, ",")),
		))
		if a.errorFor(resp, err, "remove accessor policy") != nil {
			return err
		}
	}
	return nil
}

func (a *Authorization) BDResetMember(bdid string) error {
	type (
		tResource struct {
			ID   string `json:"id"`
			Type string `json:"type"`
		}
		tRequest struct {
			Method    string      `json:"method"`
			Resources []tResource `json:"resources"`
		}
	)

	resp, err := a.private.R().SetBody(tRequest{
		Method: "DELETE",
		Resources: []tResource{
			{
				ID:   bdid,
				Type: BDResourceTypeName,
			},
		},
	}).SetError(stdErr{}).Post("/api/authorization/v1/policy-delete")

	if err := a.errorFor(resp, err, "reset resource policy"); err != nil {
		return err
	}

	return nil
}

func (a *Authorization) BDGetMember(bdid string, limit, offset int) ([]MemberInfo, int, error) {
	var result struct {
		Entries    []m `json:"entries"`
		TotalCount int `json:"total_count"`
	}
	resp, err := a.public.
		R().
		SetQueryParams(map[string]string{
			"resource_id":   bdid,
			"resource_type": BDResourceTypeName,
			"offset":        fmt.Sprintf("%d", offset),
			"limit":         fmt.Sprintf("%d", limit),
		}).
		SetResult(&result).
		SetError(stdErr{}).
		Get("/api/authorization/v1/resource-policy")

	if err := a.errorFor(resp, err, "get resource policy"); err != nil {
		return nil, 0, err
	}

	members := make([]MemberInfo, 0, len(result.Entries))
	for _, entry := range result.Entries {
		allows := entry["operation"].(m)["allow"].(l)
		role := opt2role(allows)
		if role == "" {
			// 没有权限，不是成员
			continue
		}

		members = append(members, MemberInfo{
			Role:       role,
			UID:        entry["accessor"].(m)["id"].(string),
			UType:      entry["accessor"].(m)["type"].(string),
			UName:      entry["accessor"].(m)["name"].(string),
			ParentDeps: entry["accessor"].(m)["parent_deps"].(l),
		})
	}
	return members, result.TotalCount, nil
}

func (a *Authorization) BDChangeMemberRole(bdid, uid, utype, urole string) error {

	var result struct {
		Entries    []m `json:"entries"`
		TotalCount int `json:"total_count"`
	}
	resp, err := a.public.R().SetQueryParams(map[string]string{
		"accessor_id":   uid,
		"accessor_type": utype,
		"resource_id":   bdid,
		"resource_type": BDResourceTypeName,
	}).SetResult(&result).Get("/api/authorization/v1/accessor-policy")
	if err := a.errorFor(resp, err, "query accessor policy"); err != nil {
		return err
	}

	if result.TotalCount == 0 {
		return fmt.Errorf("member not found")
	}
	if result.TotalCount > 1 {
		return fmt.Errorf("member policy conflict")
	}

	policyId := result.Entries[0]["id"].(string)
	resp, err = a.public.R().SetBody(l{m{
		"operation": m{
			"allow": role2opts(urole),
			"deny":  l{},
		},
	}}).Put(fmt.Sprintf("api/authorization/v1/policy/%s", url.PathEscape(policyId)))

	if err := a.errorFor(resp, err, "update accessor policy"); err != nil {
		return err
	}

	return nil
}
func (a *Authorization) RegisterBDType() error {
	return a.registerResourceType(BDResourceTypeName, BDResourceTypeDefine)
}

func (a *Authorization) CheckBDMember(bdid, uid, utype string) ([]string, error) {
	var result []struct {
		ID        string   `json:"id"`
		Operation []string `json:"operation"`
	}
	resp, err := a.private.R().
		SetBody(m{
			"method": "GET",
			"accessor": m{
				"id":   uid,
				"type": utype,
			},
			"resources": l{m{
				"id":   bdid,
				"type": BDResourceTypeName,
			}},
		}).
		SetError(stdErr{}).
		SetResult(&result).
		Post("/api/authorization/v1/resource-operation")
	if err := a.errorFor(resp, err, "check business domain member"); err != nil {
		return nil, err
	}

	switch len(result) {
	case 0:
		return []string{}, nil
	case 1:
		return result[0].Operation, nil
	default:
		return nil, fmt.Errorf("member policy conflict")
	}

}

func (a *Authorization) GetMemberBDs(uid, utype string) ([]string, error) {
	var result []struct {
		ID string `json:"id"`
	}
	resp, err := a.private.R().SetBody(m{
		"accessor":  m{"id": uid, "type": utype},
		"resource":  m{"type": BDResourceTypeName},
		"operation": l{},
		"method":    "GET",
	}).SetResult(&result).SetError(stdErr{}).Post("/api/authorization/v1/resource-list")
	if err := a.errorFor(resp, err, "query policy resource list policy"); err != nil {
		return nil, err
	}

	rt := make([]string, 0, len(result))
	for _, entry := range result {
		rt = append(rt, entry.ID)
	}

	return rt, nil
}

func role2opts(urole string) l {
	allows := l{m{"id": urole}}
	if urole == model.MemberRoleAdminitrator {
		allows = append(allows, m{"id": model.MemberRoleDeveloper})
	}
	return allows
}

func opt2role(opts l) string {
	for _, opt := range opts {
		if opt.(m)["id"].(string) != AuthorizePermission {
			return opt.(m)["id"].(string)
		}
	}
	return ""
}
