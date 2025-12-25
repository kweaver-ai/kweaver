package com.aishu.wf.core.doc.service;

import cn.hutool.core.util.IdUtil;
import com.aishu.wf.core.WorkflowCodeApplication;
import com.aishu.wf.core.common.exception.RestException;
import com.aishu.wf.core.doc.common.DocConstants;
import com.aishu.wf.core.doc.dao.FreeAuditDao;
import com.aishu.wf.core.doc.model.FreeAuditConfigModel;
import com.aishu.wf.core.doc.model.FreeAuditModel;
import com.aishu.wf.core.doc.model.dto.FreeAuditDeptDTO;
import com.aishu.wf.core.doc.model.dto.FreeAuditDeptQueryDTO;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Disabled
@DisplayName("免审核测试")
@ActiveProfiles("ut")
@Transactional
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = WorkflowCodeApplication.class)
public class FreeAuditServiceTest {

	private final static String USER_ID = "cd146dcc-8e9f-11eb-8826-080027383fc3";

	@Autowired
	private FreeAuditConfigService freeService;

	@Autowired
	private FreeAuditService deptService;

	@Autowired
	private FreeAuditDao freeAuditDao;

	@BeforeEach
	public void beforeEach() {
//		// 新增测试数据
//		deptService.saveFreeAuditDept(FreeAuditModel.builder()
//				.departmentId(IdUtil.randomUUID())
//				.departmentName("测试部门")
//				.createUserId(USER_ID)
//				.createTime(new Date()).build());
	}

	@Test
	@DisplayName("分页查询免审核部门列表")
	public void pageSearchFreeAuditDeptTest() {
		// 正常入参
		FreeAuditDeptQueryDTO search = new FreeAuditDeptQueryDTO();
		search.setSearch("测试");
		search.setPageNumber(1);
		search.setPageSize(10);
		IPage<FreeAuditModel> page = deptService.pageSearchFreeAuditDept(search);
		Assertions.assertNotNull(page);
		Assertions.assertTrue(page.getTotal() > 0 && page.getRecords().size() > 0);
		// 异常入参
		search.setSearch(IdUtil.randomUUID());
		IPage<FreeAuditModel> emptyPage = deptService.pageSearchFreeAuditDept(search);
		Assertions.assertNotNull(emptyPage);
		Assertions.assertTrue(emptyPage.getTotal() == 0 && emptyPage.getRecords().size() == 0);
	}

	@Test
	@DisplayName("新增免审核部门列表")
	public void saveFreeAuditDeptTest() {
		// 正常入参
		FreeAuditModel freeAuditModel = FreeAuditModel.builder()
				.departmentId(IdUtil.randomUUID())
				.departmentName("测试部门")
				.createUserId(USER_ID)
				.createTime(new Date()).build();
		//deptService.saveFreeAuditDept(freeAuditModel);
		Assertions.assertNotNull(deptService.getById(freeAuditModel.getId()));

		// 异常入参,输入空值
		try {
			//deptService.saveFreeAuditDept(new FreeAuditModel());
			Assertions.fail("空值保存成功，测试失败。");
		} catch (Exception e) {}
	}

	@Test
	@DisplayName("批量增加免审部门")
	public void saveFreeAuditVosTest() {
		// 正常入参
		List<FreeAuditDeptDTO> deptVos=new ArrayList<>();
		String id1 = IdUtil.randomUUID();
		String id2 = IdUtil.randomUUID();
		deptVos.add(new FreeAuditDeptDTO(id1, "测试"));
		deptVos.add(new FreeAuditDeptDTO(id2, "测试2"));
		deptService.saveFreeAuditVos(deptVos, USER_ID);

		FreeAuditDeptQueryDTO search = new FreeAuditDeptQueryDTO();
		search.setSearch("测试");
		search.setPageNumber(1);
		search.setPageSize(10);
		IPage<FreeAuditModel> pageWrapper = deptService.pageSearchFreeAuditDept(search);
		Assertions.assertFalse(pageWrapper.getTotal() > 0);
	}

	@Test
	@DisplayName("免审核单元测试")
	public void shareListTest() {
		// 共享者
		String ouyangfen="cd146dcc-8e9f-11eb-8826-080027383fc3";
		// 计算体系
		String calc="91119a2e-9904-11eb-a31d-080027383fc3";
		// 睿展数据
		String ruizhan="ba31c362-8e9f-11eb-8826-080027383fc3";
		// 技术中心id
		String techId="c24aaf3c-8e9f-11eb-bb3e-080027383fc3";
		// 售前中心
		String saleId="f61fd36c-8ece-11eb-8978-080027383fc3";
		// 段林贵 技术中心
		String dlgId="71fc1cbe-9b65-11eb-b9cf-080027383fc3";
		// 林磊 售前中心
		String llId="fe6c39f2-8ece-11eb-a157-080027383fc3";
		// 添加数据
		List<FreeAuditDeptDTO> list=new ArrayList<>();
		list.add(new FreeAuditDeptDTO(techId,"技术中心"));
		list.add(new FreeAuditDeptDTO(saleId,"售前中心"));
		list.add(new FreeAuditDeptDTO(ruizhan,"睿展数据"));
		list.add(new FreeAuditDeptDTO(calc,"计算体系"));
		deptService.saveFreeAuditVos(list,ouyangfen);
		// 配置密级
		freeService.updateSecurityLevelSet(6);
		Assertions.assertTrue (test(6,ouyangfen,dlgId, DocConstants.FREE_AUDIT_ACCESS_USER));
		Assertions.assertFalse(test(7,ouyangfen,llId,DocConstants.FREE_AUDIT_ACCESS_USER));
		Assertions.assertFalse (test(5,ouyangfen,calc, DocConstants.FREE_AUDIT_ACCESS_DEPARTMENT));
		Assertions.assertTrue (test(6,ouyangfen,ruizhan,DocConstants.FREE_AUDIT_ACCESS_DEPARTMENT));
		Assertions.assertFalse(test(7,ouyangfen,techId,DocConstants.FREE_AUDIT_ACCESS_DEPARTMENT));
		Assertions.assertFalse(test(8,ouyangfen,saleId,DocConstants.FREE_AUDIT_ACCESS_DEPARTMENT));
		try {
			test(0,null,null,null);
			Assertions.fail();
		}catch (RestException | NumberFormatException ignored){}
		try {
			test(-100," ","","");
			Assertions.fail();
		}catch (RestException | NumberFormatException e){}
	}

	@Test
	@DisplayName("更新直属部门状态")
	public void updateDeptState() {
		// 更新直属部门状态
		freeService.updateSelfDeptFreeAuditState("Y");
		Assertions.assertEquals(freeService.getSelfDeptFreeAuditState(), "Y");
		freeService.updateSelfDeptFreeAuditState("N");
		Assertions.assertEquals(freeService.getSelfDeptFreeAuditState(), "N");
		try {
			freeService.updateSelfDeptFreeAuditState("J");
			Assertions.fail();
		}catch (RestException ignored){
			ignored.printStackTrace();
		}
		try {
			freeService.updateSelfDeptFreeAuditState(null);
			Assertions.fail();
		}catch (RestException ignored){
			ignored.printStackTrace();}
	}

	@Test
	@DisplayName("查询所有密级")
	public void getAllLevels() {
		// 查询所有密级
		Map<String,Integer> levels=freeService.getSecurityLevelAll();
		Assertions.assertFalse(levels.isEmpty());
		for (String str:levels.keySet()){
			System.out.println(str);
		}
	}

	@Test
	@DisplayName("更新密级代码")
	public void updateLevel() {
		// 更新密级代码
		freeService.updateSecurityLevelSet(5);
		Assertions.assertEquals(freeService.getSetSecurityLevel(), 5);
		freeService.updateSecurityLevelSet(6);
		Assertions.assertEquals(freeService.getSetSecurityLevel(), 6);
		freeService.updateSecurityLevelSet(7);
		Assertions.assertEquals(freeService.getSetSecurityLevel(), 7);
		freeService.updateSecurityLevelSet(8);
		Assertions.assertEquals(freeService.getSetSecurityLevel(), 8);
		try {
			freeService.updateSecurityLevelSet(10);
			Assertions.fail();
		}catch (RestException e){}
		try {
			freeService.updateSecurityLevelSet(null);
			Assertions.fail();
		}catch (RestException e){}
	}

	@Test
	@DisplayName("查询是否小于或等于设置的密级")
	public void queryIsSmallOrEqSetLevel() {
		// 查询是否小于或等于设置的密级
		freeService.updateSecurityLevelSet(6);
		Assertions.assertTrue (freeService.isSmallOrEqSetLevel(5));
		Assertions.assertTrue (freeService.isSmallOrEqSetLevel(6));
		Assertions.assertFalse (freeService.isSmallOrEqSetLevel(7));
		Assertions.assertFalse (freeService.isSmallOrEqSetLevel(8));
	}

	@Test
	@DisplayName("查询配置")
	public void queryConfig() {
		// 查询配置
		FreeAuditConfigModel freeAuditConfigModel =freeService.getConfig();
		Assertions.assertTrue(null!= freeAuditConfigModel);
		System.out.println(freeAuditConfigModel.toString());
	}

	@Test
	@DisplayName("删除免审部门")
	public void deleteFreeAuditDept() {
		// 删除免审部门
		freeAuditDao.insert(new FreeAuditModel("1","1",
				"1","1","1",new Date(System.currentTimeMillis())));
		deptService.deleteFreeAuditByIds("1");
		try {
			deptService.deleteFreeAuditByIds("1");
			Assertions.fail();
		}catch (IllegalArgumentException e){}
	}

	public boolean test(int csfLevelCode,String shareUserId,String accseeorId,String type){
		return freeService.verdictDeptFreeAudit(csfLevelCode, shareUserId, accseeorId, type);
	}
}
