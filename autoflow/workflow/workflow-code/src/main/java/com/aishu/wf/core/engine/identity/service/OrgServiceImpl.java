package com.aishu.wf.core.engine.identity.service;

import com.aishu.wf.core.engine.identity.OrgService;
import com.aishu.wf.core.engine.identity.dao.OrgQueryDao;
import com.aishu.wf.core.engine.identity.model.Org;
import com.aishu.wf.core.engine.identity.util.IdentityException;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrgServiceImpl  extends ServiceImpl<OrgQueryDao,Org> implements OrgService {
	private static final Log logger = LogFactory.getLog(OrgServiceImpl.class);
	@Autowired
	private OrgQueryDao orgQueryDao;
	
	@Override
	public Org getOrgById(String orgId) {
		return this.getById(orgId);
	}

	@Override
	public List<Org> findParentOrgTree(String orgId) {
		throw new UnsupportedOperationException();
		//return findParentOrgTree(orgId,false);
	}
	
	@Override
	public List<Org> findParentOrgTree(String orgId,boolean isIncludeSelf) {
		throw new UnsupportedOperationException();
		/*List<Org> orgs=null;
		try{
			Org param=new Org();
			param.setOrgId(orgId);
			orgs=orgQueryDao.findParentOrgTree(param);
		}catch(Exception e){
			logger.error(e);
			throw new IdentityException(e);
		}
		return orgs;*/
	}


	@Override
	public List<Org> findParentOrgTree(String orgId, Integer orgLevel) {
		throw new UnsupportedOperationException();
		/*List<Org> orgs=null;
		try{
			Org params=new Org();
			params.setOrgId(orgId);
			params.setOrgLevel(orgLevel);
			orgs=orgQueryDao.findParentOrgTree(params);
		}catch(Exception e){
			logger.error(e);
			throw new IdentityException(e);
		}
		return orgs;*/
	}
	
	@Override
	public List<Org> findOrgByOrgIds(List<String> orgIds) {
		List<Org> orgs=null;
		try{
			orgs=orgQueryDao.findOrgByIds(orgIds);
		}catch(Exception e){
			logger.warn(e);
			throw new IdentityException(e);
		}
		return orgs;
	}

	@Override
	public String getFullPathName(String orgId,String pjStr) {
		throw new UnsupportedOperationException();
		/*String result = "";
		try {
			List<Org> orgs=orgQueryDao.findFullPath(orgId);
			for(int i=orgs.size()-1; i>=0; i--) {
				Org org = orgs.get(i);
				if(org.getOrgLevel() >=1)
					result += org.getOrgName() + pjStr;
			}
			if(StringUtils.isNotEmpty(result)){
				result=result.substring(0,result.lastIndexOf(pjStr));
			}				
		}catch(Exception e) {
			logger.error(e);
			throw new IdentityException(e);
		}
		return result;*/
	}
}
