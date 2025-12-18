package com.aishu.wf.api.model;

import com.aishu.wf.core.anyshare.model.Department;
import com.aishu.wf.core.anyshare.model.User;
import lombok.Data;

import java.util.List;

/**
 * @author hanj
 * @version 1.0
 * @description: TODO
 * @date 2022/5/26 17:10
 */
@Data
public class AsUserVO {

    /**
     * 名称
     */
    private String name;
    /**
     * 登录名
     */
    private String account;
    /**
     * 用户ID
     */
    private String id;
    /**
     * 父部门组织路径
     */
    private String parent_dep_paths;

    public static AsUserVO buildAsUserVO(User user, String userId) {
        AsUserVO asUserVO = new AsUserVO();
        asUserVO.setAccount(user.getAccount());
        asUserVO.setName(user.getName());
        asUserVO.setId(userId);

        List<List<Department>> departList = user.getParent_deps();
        String parent_dep_paths = "";
        if(departList.size() > 0){
            StringBuilder builder = new StringBuilder();
            List<Department> departments = departList.get(0);
            for(int i = 0;i < departments.size();i++){
                if(i < departments.size() - 1){
                    builder.append(departments.get(i).getName()).append("/");
                } else {
                    builder.append(departments.get(i).getName());
                }
            }
            parent_dep_paths = builder.toString();
        }
        asUserVO.setParent_dep_paths(parent_dep_paths);
        return asUserVO;
    }
}
