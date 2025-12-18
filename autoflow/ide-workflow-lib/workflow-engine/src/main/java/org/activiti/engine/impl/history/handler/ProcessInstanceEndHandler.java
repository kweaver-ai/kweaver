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

package org.activiti.engine.impl.history.handler;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.ExecutionListener;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.ExecutionEntity;
import org.apache.commons.lang3.StringUtils;


/**
 * @author Tom Baeyens
 */
public class ProcessInstanceEndHandler implements ExecutionListener {

	public void notify(DelegateExecution execution) {
		// 是否自动拒绝
		String autoReject = (String) execution.getVariable("auto_reject");
		if (StringUtils.isEmpty(autoReject)) {
			// 正常执行记录流程信息
			Context.getCommandContext().getHistoryManager().recordProcessInstanceEnd(execution.getProcessInstanceId(),
					((ExecutionEntity) execution).getDeleteReason(), ((ExecutionEntity) execution).getActivityId());
		} else {
			// 自动拒绝记录流程信息
			Context.getCommandContext().getHistoryManager().recordProcessInstanceAutoEnd(
					execution.getProcessInstanceId(), ((ExecutionEntity) execution).getDeleteReason(),
					((ExecutionEntity) execution).getActivityId());
		}
	}
}
