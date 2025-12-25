/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.aishu.wf.core.engine.core.handler;

import java.util.Map;

import org.activiti.engine.impl.delegate.DelegateInvocation;

/**
 * 引擎业务应用全局回调处理拦截器
 * @version:  1.0
 * @author lw 
 */
public class GlobalBizHandlerInvocation extends DelegateInvocation {

	protected final GlobalBizHandler wfBusinessAgentService;
	protected final Map<String, Object> resultMap;

	public GlobalBizHandlerInvocation(
			GlobalBizHandler wfBusinessAgentService,
			Map<String, Object> result) {
		this.wfBusinessAgentService = wfBusinessAgentService;
		this.resultMap = result;
	}

	protected void invoke() throws Exception {
		//TaskEntity task=(TaskEntity) delegateTask;
		wfBusinessAgentService.execute(resultMap);
	}

	public Object getTarget() {
		return wfBusinessAgentService;
	}
	
	

}
