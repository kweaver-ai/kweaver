package bizdomainsvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/bizdomainhttp/bizdomainhttpreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/bizdomainhttp/bizdomainhttpres"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"
)

// AssociateResourceTest 测试资源关联
func (s *BizDomainSvc) AssociateResourceTest(ctx context.Context, agentID string) error {
	bdID := cenum.BizDomainPublic.ToString()

	associateReq := &bizdomainhttpreq.AssociateResourceReq{
		BdID: bdID,
		ID:   agentID,
		Type: cdaenum.ResourceTypeDataAgent,
	}

	err := s.bizDomainHttp.AssociateResource(ctx, associateReq)
	if err != nil {
		s.logger.Errorln("AssociateResourceTest: AssociateResource failed", err)
		return err
	}

	return nil
}

// QueryResourceAssociationsTest 测试关联关系查询
func (s *BizDomainSvc) QueryResourceAssociationsTest(ctx context.Context, agentID string) (*bizdomainhttpres.QueryResourceAssociationsRes, error) {
	bdID := cenum.BizDomainPublic.ToString()

	// 如果指定了agentID，则查询特定agent的关联关系
	if agentID != "" {
		querySingleReq := &bizdomainhttpreq.QueryResourceAssociationsReq{
			BdID:   bdID,
			ID:     agentID,
			Type:   cdaenum.ResourceTypeDataAgent,
			Limit:  20,
			Offset: 0,
		}

		res, err := s.bizDomainHttp.QueryResourceAssociations(ctx, querySingleReq)
		if err != nil {
			s.logger.Errorln("QueryResourceAssociationsTest: QueryResourceAssociations failed", err)
			return nil, err
		}

		s.logger.Infoln("=== 查询特定Agent关联关系 ===")
		s.logger.Infof("Agent ID: %s", agentID)
		s.logger.Infof("查询到 %d 条关联关系", len(res.Items))

		for i, item := range res.Items {
			s.logger.Infof("  [%d] ID: %s, Type: %s, BdID: %s, CreateBy: %s", i+1, item.ID, item.Type, item.BdID, item.CreateBy)
		}

		return res, nil
	} else {
		// 查询所有关联关系
		queryReq := &bizdomainhttpreq.QueryResourceAssociationsReq{
			BdID:   bdID,
			Limit:  20,
			Offset: 0,
		}

		res, err := s.bizDomainHttp.QueryResourceAssociations(ctx, queryReq)
		if err != nil {
			s.logger.Errorln("QueryResourceAssociationsTest: QueryResourceAssociations failed", err)
			return nil, err
		}

		s.logger.Infoln("=== 查询所有关联关系 ===")
		s.logger.Infof("查询到 %d 条关联关系", len(res.Items))

		for i, item := range res.Items {
			s.logger.Infof("  [%d] ID: %s, Type: %s, BdID: %s, CreateBy: %s", i+1, item.ID, item.Type, item.BdID, item.CreateBy)
		}

		return res, nil
	}
}

// DisassociateResourceTest 测试资源取消关联
func (s *BizDomainSvc) DisassociateResourceTest(ctx context.Context, agentID string) error {
	bdID := cenum.BizDomainPublic.ToString()

	disassociateReq := &bizdomainhttpreq.DisassociateResourceReq{
		BdID: bdID,
		ID:   agentID,
		Type: cdaenum.ResourceTypeDataAgent,
	}

	err := s.bizDomainHttp.DisassociateResource(ctx, disassociateReq)
	if err != nil {
		s.logger.Errorln("DisassociateResourceTest: DisassociateResource failed", err)
		return err
	}

	return nil
}

// HasResourceAssociationTest 测试单个资源关联关系查询
func (s *BizDomainSvc) HasResourceAssociationTest(ctx context.Context, agentID string) (hasAssociation bool, err error) {
	bdID := cenum.BizDomainPublic.ToString()

	req := &bizdomainhttpreq.QueryResourceAssociationSingleReq{
		BdID: bdID,
		ID:   agentID,
		Type: cdaenum.ResourceTypeDataAgent,
	}

	hasAssociation, err = s.bizDomainHttp.HasResourceAssociation(ctx, req)
	if err != nil {
		s.logger.Errorln("HasResourceAssociationTest: HasResourceAssociation failed", err)
		return false, err
	}

	return hasAssociation, nil
}

// TestBizDomainHttp 测试业务域HTTP接口（保留原方法作为完整流程测试）
func (s *BizDomainSvc) TestBizDomainHttp(ctx context.Context, agentID string) error {
	// 1. 测试资源关联
	err := s.AssociateResourceTest(ctx, agentID)
	if err != nil {
		return err
	}

	// 2. 测试关联关系查询
	_, err = s.QueryResourceAssociationsTest(ctx, agentID)
	if err != nil {
		return err
	}

	// 3. 测试资源取消关联
	err = s.DisassociateResourceTest(ctx, agentID)
	if err != nil {
		return err
	}

	return nil
}
