package com.aishu.wf.core.engine.util;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.Polygon;
import java.awt.RenderingHints;
import java.awt.Stroke;
import java.awt.geom.AffineTransform;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Ellipse2D.Double;
import java.awt.geom.Line2D;
import java.awt.geom.Path2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import org.activiti.bpmn.constants.BpmnXMLConstants;
import org.activiti.bpmn.model.Artifact;
import org.activiti.bpmn.model.BpmnModel;
import org.activiti.bpmn.model.FlowElement;
import org.activiti.bpmn.model.FlowElementsContainer;
import org.activiti.bpmn.model.FlowNode;
import org.activiti.bpmn.model.GraphicInfo;
import org.activiti.bpmn.model.Lane;
import org.activiti.bpmn.model.Pool;
import org.activiti.bpmn.model.SequenceFlow;
import org.activiti.engine.history.HistoricActivityInstance;
import org.activiti.engine.history.HistoricProcessInstance;
import org.activiti.engine.impl.HistoricActivityInstanceQueryImpl;
import org.activiti.engine.impl.Page;
import org.activiti.engine.impl.RepositoryServiceImpl;
import org.activiti.engine.impl.bpmn.behavior.CallActivityBehavior;
import org.activiti.engine.impl.bpmn.behavior.ParallelMultiInstanceBehavior;
import org.activiti.engine.impl.cmd.GetBpmnModelCmd;
import org.activiti.engine.impl.context.Context;
import org.activiti.engine.impl.persistence.entity.HistoricActivityInstanceEntity;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.persistence.entity.SuspensionState;
import org.activiti.engine.impl.pvm.PvmTransition;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.apache.commons.io.FilenameUtils;

/**
 * 流程图绘制工具
 */
public class CustomProcessDiagramGenerator {
	public static final int OFFSET_SUBPROCESS = 5;
	public static final int OFFSET_TASK = 0;
	private static List<String> taskType = new ArrayList<String>();
	private static List<String> eventType = new ArrayList<String>();
	private static List<String> gatewayType = new ArrayList<String>();
	private static List<String> subProcessType = new ArrayList<String>();
	private static Color RUNNING_COLOR = Color.RED;
	private static Color HISTORY_COLOR = new Color(0, 255, 0);
	private static Color CANCELED_COLOR = new Color(128, 42, 42);
	
	private static Stroke THICK_BORDER_STROKE = new BasicStroke(3.0f);
	private int minX;
	private int minY;

	public CustomProcessDiagramGenerator() {
		init();
	}

	protected static void init() {
		taskType.add(BpmnXMLConstants.ELEMENT_CALL_ACTIVITY);
		taskType.add(BpmnXMLConstants.ELEMENT_TASK_MANUAL);
		taskType.add(BpmnXMLConstants.ELEMENT_TASK_RECEIVE);
		taskType.add(BpmnXMLConstants.ELEMENT_TASK_SCRIPT);
		taskType.add(BpmnXMLConstants.ELEMENT_TASK_SEND);
		taskType.add(BpmnXMLConstants.ELEMENT_TASK_SERVICE);
		taskType.add(BpmnXMLConstants.ELEMENT_TASK_USER);

		gatewayType.add(BpmnXMLConstants.ELEMENT_GATEWAY_EXCLUSIVE);
		gatewayType.add(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE);
		//gatewayType.add(BpmnXMLConstants.ELEMENT_GATEWAY_EVENT);
		gatewayType.add(BpmnXMLConstants.ELEMENT_GATEWAY_PARALLEL);

		eventType.add("intermediateTimer");
		eventType.add("intermediateMessageCatch");
		eventType.add("intermediateSignalCatch");
		eventType.add("intermediateSignalThrow");
		eventType.add("messageStartEvent");
		eventType.add("startTimerEvent");
		eventType.add(BpmnXMLConstants.ELEMENT_ERROR);
		eventType.add(BpmnXMLConstants.ELEMENT_EVENT_START);
		eventType.add("errorEndEvent");
		eventType.add(BpmnXMLConstants.ELEMENT_EVENT_END);

		subProcessType.add(BpmnXMLConstants.ELEMENT_SUBPROCESS);
		subProcessType.add(BpmnXMLConstants.ELEMENT_CALL_ACTIVITY);
	}

	public InputStream generateDiagram(String processInstanceId)
			throws IOException {
		HistoricProcessInstance historicProcessInstance = Context
				.getCommandContext().getHistoricProcessInstanceEntityManager()
				.findHistoricProcessInstance(processInstanceId);
		String processDefinitionId = historicProcessInstance
				.getProcessDefinitionId();
		GetBpmnModelCmd getBpmnModelCmd = new GetBpmnModelCmd(
				processDefinitionId);
		BpmnModel bpmnModel = getBpmnModelCmd.execute(Context
				.getCommandContext());
		Point point = getMinXAndMinY(bpmnModel);
		this.minX = point.x;
		this.minY = point.y;
		this.minX = (this.minX <= 5) ? 5 : this.minX;
		this.minY = (this.minY <= 5) ? 5 : this.minY;
		this.minX -= 5;
		this.minY -= 5;

		ProcessDefinitionEntity definition = Context
				.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		if (definition == null) {
			RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) Context
					.getProcessEngineConfiguration().getRepositoryService();
			definition = (ProcessDefinitionEntity) repositoryServiceImpl
					.getDeployedProcessDefinition(processDefinitionId);

		}
		String diagramResourceName = definition.getDiagramResourceName();
		String deploymentId = definition.getDeploymentId();
		byte[] bytes = Context
				.getCommandContext()
				.getResourceEntityManager()
				.findResourceByDeploymentIdAndResourceName(deploymentId,
						diagramResourceName).getBytes();
		InputStream originDiagram = new ByteArrayInputStream(bytes);
		BufferedImage image = ImageIO.read(originDiagram);
		HistoricActivityInstanceQueryImpl historicActivityInstanceQueryImpl = new HistoricActivityInstanceQueryImpl();
		historicActivityInstanceQueryImpl.processInstanceId(processInstanceId)
				.orderByHistoricActivityInstanceStartTime().asc();

		Page page = new Page(0, 1000);
		List<HistoricActivityInstance> activityInstances = Context
				.getCommandContext()
				.getHistoricActivityInstanceEntityManager()
				.findHistoricActivityInstancesByQueryCriteria(
						historicActivityInstanceQueryImpl, page);
		Map<String,List<HistoricActivityInstance>> hisCallActivityMap=new HashMap<String,List<HistoricActivityInstance>>();
		Map<String,List<HistoricActivityInstance>> hisMultiActivityMap=new HashMap<String,List<HistoricActivityInstance>>();
		
		for (HistoricActivityInstance historicActivityInstance : activityInstances) {
			String historicActivityId = historicActivityInstance
					.getActivityId();
			ActivityImpl activity = definition.findActivity(historicActivityId);
			boolean isCallSubProcessFlag=ProcessDefinitionUtils.isCallSubProcess(activity);
			boolean isMultiActivityFlag=ProcessDefinitionUtils.isMultiInstance(activity);
			if(isCallSubProcessFlag){
				if(hisCallActivityMap.containsKey(historicActivityInstance.getExecutionId())){
					((List<HistoricActivityInstance>)hisCallActivityMap.get(historicActivityInstance.getExecutionId())).add(historicActivityInstance);
				}else{
					List<HistoricActivityInstance> hisCallActivitys=new ArrayList<HistoricActivityInstance>();
					hisCallActivitys.add(historicActivityInstance);
					hisCallActivityMap.put(historicActivityInstance.getExecutionId(), hisCallActivitys);
				}
			}else if(isMultiActivityFlag){
				String key=historicActivityInstance.getProcessInstanceId()+historicActivityInstance.getActivityId();
				if(hisMultiActivityMap.containsKey(key)){
					((List<HistoricActivityInstance>)hisMultiActivityMap.get(key)).add(historicActivityInstance);
				}else{
					List<HistoricActivityInstance> hisMultiActivitys=new ArrayList<HistoricActivityInstance>();
					hisMultiActivitys.add(historicActivityInstance);
					hisMultiActivityMap.put(key, hisMultiActivitys);
				}
			}
			if (activity != null&&!(isCallSubProcessFlag||isMultiActivityFlag)) {
				Color nodeColor=null;
				if (historicActivityId.equals(historicProcessInstance
						.getEndActivityId())
						&& SuspensionState.CANCELED.getStateCode() == historicProcessInstance
								.getProcState()) {// 节点已经作废
					nodeColor=CANCELED_COLOR;
				} else if(historicActivityInstance.getEndTime() == null) { // 节点正在运行中
					nodeColor=RUNNING_COLOR;
				} else {// 节点已经结束
					nodeColor=HISTORY_COLOR;
				}
				signNode(nodeColor, image, activity.getX()
						- this.minX, activity.getY() - this.minY,
						activity.getWidth(), activity.getHeight(),
						historicActivityInstance.getActivityType());
			}
		}
		drawHistoryCallActivity(historicProcessInstance,hisMultiActivityMap, definition, image);
		drawHistoryCallActivity(historicProcessInstance,hisCallActivityMap, definition, image);
		drawHistoryFlow(historicProcessInstance,activityInstances,image, processInstanceId);

		ByteArrayOutputStream out = new ByteArrayOutputStream();
		String formatName = getDiagramExtension(diagramResourceName);
		ImageIO.write(image, formatName, out);
		return new ByteArrayInputStream(out.toByteArray());
	}
	
	private void drawHistoryCallActivity(HistoricProcessInstance historicProcessInstance,Map<String, List<HistoricActivityInstance>> hisCallActivityMap,
			ProcessDefinitionEntity definition, BufferedImage image) {
		if (hisCallActivityMap.isEmpty()) {
			return ;
		}
			for (Map.Entry<String, List<HistoricActivityInstance>> hisCallActivityEntry : hisCallActivityMap
					.entrySet()) {
				boolean isEnd = true;
				ActivityImpl activity = null;
				List<HistoricActivityInstance> hisCallActivitys = hisCallActivityEntry.getValue();
				for (HistoricActivityInstance historicActivityInstance : hisCallActivitys) {
					String historicActivityId = historicActivityInstance.getActivityId();
					activity = definition.findActivity(historicActivityId);
					if (null != activity) {
						if (historicActivityInstance.getEndTime() == null) {
							isEnd = false;
							break;
						}
					}
				}
				Color nodeColor = null;
				String id = "";
				int x = 0;
				int y = 0;
				int width = 0;
				int height = 0;
				if(null != activity){
					id = activity.getId();
					x = activity.getX();
					y = activity.getY();
					width = activity.getWidth();
					height = activity.getHeight();
				}
				if (id.equals(historicProcessInstance
						.getEndActivityId())
						&& SuspensionState.CANCELED.getStateCode() == historicProcessInstance
								.getProcState()) {// 节点已经作废
					nodeColor=CANCELED_COLOR;
				}else if (isEnd) {
					// 节点已经结束
					nodeColor = HISTORY_COLOR;
				} else {
					nodeColor = RUNNING_COLOR;
				}
				signNode(nodeColor, image, x - this.minX, y - this.minY, width,
						height, BpmnXMLConstants.ELEMENT_CALL_ACTIVITY);
			}
		
	}
	
	public String[] getDiagramSize(String processDefinitionId)
			throws IOException {
		ProcessDefinitionEntity definition = Context
				.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		if (definition == null) {
			RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) Context
					.getProcessEngineConfiguration().getRepositoryService();
			definition = (ProcessDefinitionEntity) repositoryServiceImpl
					.getDeployedProcessDefinition(processDefinitionId);

		}
		String diagramResourceName = definition.getDiagramResourceName();
		String deploymentId = definition.getDeploymentId();
		byte[] bytes = Context
				.getCommandContext()
				.getResourceEntityManager()
				.findResourceByDeploymentIdAndResourceName(deploymentId,
						diagramResourceName).getBytes();
		InputStream originDiagram = new ByteArrayInputStream(bytes);
		BufferedImage image = ImageIO.read(originDiagram);

		String[] result=new String[2];
		result[0]=String.valueOf(image.getWidth());
		result[1]=String.valueOf(image.getHeight());
		return result;
	}

	private static String getDiagramExtension(String diagramResourceName) {
		return FilenameUtils.getExtension(diagramResourceName);
	}

	/**
	 * 标记节点
	 * 
	 * @param image
	 *            原始图片
	 * @param x
	 *            左上角节点坐在X位置
	 * @param y
	 *            左上角节点坐在Y位置
	 * @param width
	 *            宽
	 * @param height
	 *            高
	 * @param activityType
	 *            节点类型
	 */
	private static void signNode(Color nodeColor, BufferedImage image, int x,
			int y, int width, int height, String activityType) {
		Graphics2D graphics = image.createGraphics();

		try {
			 //消除线条锯齿
		    graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		     
			drawNodeBorder(x, y, width, height, graphics, nodeColor,
					activityType);
		} finally {
			graphics.dispose();
		}
	}
	
	
	private static void signNodeCount(BufferedImage image, int x, int y,
			String activityId, String activityType) {
		Graphics2D graphics = image.createGraphics();

		try {
			graphics.setPaint(Color.BLACK);
			graphics.setStroke(new BasicStroke(5f));
			String count = "8";
			graphics.drawString(count, x + 43, y + 25);
		} finally {
			graphics.dispose();
		}
	}

	/**
	 * 绘制节点边框
	 * 
	 * @param x
	 *            左上角节点坐在X位置
	 * @param y
	 *            左上角节点坐在Y位置
	 * @param width
	 *            宽
	 * @param height
	 *            高
	 * @param graphics
	 *            绘图对象
	 * @param color
	 *            节点边框颜色
	 * @param activityType
	 *            节点类型
	 */
	protected static void drawNodeBorder(int x, int y, int width, int height,
			Graphics2D graphics, Color color, String activityType) {
		graphics.setPaint(color);
		graphics.setStroke(THICK_BORDER_STROKE);
		if (taskType.contains(activityType)) {
			drawTask(x, y, width, height, graphics);
		} else if (gatewayType.contains(activityType)) {
			drawGateway(x, y, width, height, graphics);
		} else if (eventType.contains(activityType)) {
			drawEvent(x, y, width, height, graphics);
		} else if (subProcessType.contains(activityType)) {
			drawSubProcess(x, y, width, height, graphics);
		}
	}

	/**
	 * 绘制任务
	 */
	protected static void drawTask(int x, int y, int width, int height,
			Graphics2D graphics) {
		RoundRectangle2D rect = new RoundRectangle2D.Double(x, y, width,
				height, OFFSET_TASK, OFFSET_TASK);
		graphics.draw(rect);
	}

	/**
	 * 绘制网关
	 */
	protected static void drawGateway(int x, int y, int width, int height,
			Graphics2D graphics) {
		Polygon rhombus = new Polygon();
		rhombus.addPoint(x, y + (height / 2));
		rhombus.addPoint(x + (width / 2), y + height);
		rhombus.addPoint(x + width, y + (height / 2));
		rhombus.addPoint(x + (width / 2), y);
		graphics.draw(rhombus);
	}

	/**
	 * 绘制任务
	 */
	protected static void drawEvent(int x, int y, int width, int height,
			Graphics2D graphics) {
		Double circle = new Ellipse2D.Double(x, y, width, height);
		graphics.draw(circle);
	}

	/**
	 * 绘制子流程
	 */
	protected static void drawSubProcess(int x, int y, int width, int height,
			Graphics2D graphics) {
		RoundRectangle2D rect = new RoundRectangle2D.Double(x + 1, y + 1,
				width - 2, height - 2, OFFSET_SUBPROCESS, OFFSET_SUBPROCESS);
		graphics.draw(rect);
	}

	protected Point getMinXAndMinY(BpmnModel bpmnModel) {
		// We need to calculate maximum values to know how big the image will be
		// in its entirety
		double theMinX = java.lang.Double.MAX_VALUE;
		double theMaxX = 0;
		double theMinY = java.lang.Double.MAX_VALUE;
		double theMaxY = 0;

		for (Pool pool : bpmnModel.getPools()) {
			GraphicInfo graphicInfo = bpmnModel.getGraphicInfo(pool.getId());
			theMinX = graphicInfo.getX();
			theMaxX = graphicInfo.getX() + graphicInfo.getWidth();
			theMinY = graphicInfo.getY();
			theMaxY = graphicInfo.getY() + graphicInfo.getHeight();
		}

		List<FlowNode> flowNodes = gatherAllFlowNodes(bpmnModel);

		for (FlowNode flowNode : flowNodes) {
			GraphicInfo flowNodeGraphicInfo = bpmnModel.getGraphicInfo(flowNode
					.getId());

			// width
			if ((flowNodeGraphicInfo.getX() + flowNodeGraphicInfo.getWidth()) > theMaxX) {
				theMaxX = flowNodeGraphicInfo.getX()
						+ flowNodeGraphicInfo.getWidth();
			}

			if (flowNodeGraphicInfo.getX() < theMinX) {
				theMinX = flowNodeGraphicInfo.getX();
			}

			// height
			if ((flowNodeGraphicInfo.getY() + flowNodeGraphicInfo.getHeight()) > theMaxY) {
				theMaxY = flowNodeGraphicInfo.getY()
						+ flowNodeGraphicInfo.getHeight();
			}

			if (flowNodeGraphicInfo.getY() < theMinY) {
				theMinY = flowNodeGraphicInfo.getY();
			}

			for (SequenceFlow sequenceFlow : flowNode.getOutgoingFlows()) {
				List<GraphicInfo> graphicInfoList = bpmnModel
						.getFlowLocationGraphicInfo(sequenceFlow.getId());

				for (GraphicInfo graphicInfo : graphicInfoList) {
					// width
					if (graphicInfo.getX() > theMaxX) {
						theMaxX = graphicInfo.getX();
					}

					if (graphicInfo.getX() < theMinX) {
						theMinX = graphicInfo.getX();
					}

					// height
					if (graphicInfo.getY() > theMaxY) {
						theMaxY = graphicInfo.getY();
					}

					if (graphicInfo.getY() < theMinY) {
						theMinY = graphicInfo.getY();
					}
				}
			}
		}

		List<Artifact> artifacts = gatherAllArtifacts(bpmnModel);

		for (Artifact artifact : artifacts) {
			GraphicInfo artifactGraphicInfo = bpmnModel.getGraphicInfo(artifact
					.getId());

			if (artifactGraphicInfo != null) {
				// width
				if ((artifactGraphicInfo.getX() + artifactGraphicInfo
						.getWidth()) > theMaxX) {
					theMaxX = artifactGraphicInfo.getX()
							+ artifactGraphicInfo.getWidth();
				}

				if (artifactGraphicInfo.getX() < theMinX) {
					theMinX = artifactGraphicInfo.getX();
				}

				// height
				if ((artifactGraphicInfo.getY() + artifactGraphicInfo
						.getHeight()) > theMaxY) {
					theMaxY = artifactGraphicInfo.getY()
							+ artifactGraphicInfo.getHeight();
				}

				if (artifactGraphicInfo.getY() < theMinY) {
					theMinY = artifactGraphicInfo.getY();
				}
			}

			List<GraphicInfo> graphicInfoList = bpmnModel
					.getFlowLocationGraphicInfo(artifact.getId());

			if (graphicInfoList != null) {
				for (GraphicInfo graphicInfo : graphicInfoList) {
					// width
					if (graphicInfo.getX() > theMaxX) {
						theMaxX = graphicInfo.getX();
					}

					if (graphicInfo.getX() < theMinX) {
						theMinX = graphicInfo.getX();
					}

					// height
					if (graphicInfo.getY() > theMaxY) {
						theMaxY = graphicInfo.getY();
					}

					if (graphicInfo.getY() < theMinY) {
						theMinY = graphicInfo.getY();
					}
				}
			}
		}

		int nrOfLanes = 0;

		for (org.activiti.bpmn.model.Process process : bpmnModel.getProcesses()) {
			for (Lane l : process.getLanes()) {
				nrOfLanes++;

				GraphicInfo graphicInfo = bpmnModel.getGraphicInfo(l.getId());

				// // width
				if ((graphicInfo.getX() + graphicInfo.getWidth()) > theMaxX) {
					theMaxX = graphicInfo.getX() + graphicInfo.getWidth();
				}

				if (graphicInfo.getX() < theMinX) {
					theMinX = graphicInfo.getX();
				}

				// height
				if ((graphicInfo.getY() + graphicInfo.getHeight()) > theMaxY) {
					theMaxY = graphicInfo.getY() + graphicInfo.getHeight();
				}

				if (graphicInfo.getY() < theMinY) {
					theMinY = graphicInfo.getY();
				}
			}
		}

		// Special case, see http://jira.codehaus.org/browse/ACT-1431
		if ((flowNodes.size() == 0) && (bpmnModel.getPools().size() == 0)
				&& (nrOfLanes == 0)) {
			// Nothing to show
			theMinX = 0;
			theMinY = 0;
		}

		return new Point((int) theMinX, (int) theMinY);
	}

	protected static List<Artifact> gatherAllArtifacts(BpmnModel bpmnModel) {
		List<Artifact> artifacts = new ArrayList<Artifact>();

		for (org.activiti.bpmn.model.Process process : bpmnModel.getProcesses()) {
			artifacts.addAll(process.getArtifacts());
		}

		return artifacts;
	}

	protected static List<FlowNode> gatherAllFlowNodes(BpmnModel bpmnModel) {
		List<FlowNode> flowNodes = new ArrayList<FlowNode>();

		for (org.activiti.bpmn.model.Process process : bpmnModel.getProcesses()) {
			flowNodes.addAll(gatherAllFlowNodes(process));
		}

		return flowNodes;
	}

	protected static List<FlowNode> gatherAllFlowNodes(
			FlowElementsContainer flowElementsContainer) {
		List<FlowNode> flowNodes = new ArrayList<FlowNode>();

		for (FlowElement flowElement : flowElementsContainer.getFlowElements()) {
			if (flowElement instanceof FlowNode) {
				flowNodes.add((FlowNode) flowElement);
			}

			if (flowElement instanceof FlowElementsContainer) {
				flowNodes
						.addAll(gatherAllFlowNodes((FlowElementsContainer) flowElement));
			}
		}

		return flowNodes;
	}

	private void drawHistoryFlow(HistoricProcessInstance historicProcessInstance,
			List<HistoricActivityInstance> historicActivityInstances, BufferedImage image, String processInstanceId) {
		String processDefinitionId = historicProcessInstance.getProcessDefinitionId();

		ProcessDefinitionEntity processDefinition = Context.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		List<String> historicActivityInstanceList = new ArrayList<String>();

		for (HistoricActivityInstance hai : historicActivityInstances) {
			historicActivityInstanceList.add(hai.getActivityId());
		}

		List<ActivityImpl> activityImpls = new ArrayList<ActivityImpl>();
		addAllActivityImpl(processDefinition.getActivities(), activityImpls);
		// activities and their sequence-flows
		for (ActivityImpl activity : activityImpls) {
			int index = historicActivityInstanceList.indexOf(activity.getId());

			// 说明经过了这个节点，并且这个节点不是最后一个节点，所以可能有后续高亮的连线
			if ((index >= 0) && ((index + 1) < historicActivityInstanceList.size())) {
				List<PvmTransition> pvmTransitionList = activity.getOutgoingTransitions();

				for (HistoricActivityInstance srcHistoricActivityInstance : historicActivityInstances) {
					if ((!activity.getId().equals(srcHistoricActivityInstance.getActivityId()))
							|| (srcHistoricActivityInstance.getEndTime() == null)) {
						continue;
					}

					for (PvmTransition pvmTransition : pvmTransitionList) {
						String destinationFlowId = pvmTransition.getDestination().getId();

						for (HistoricActivityInstance destHistoricActivityInstance : historicActivityInstances) {
							long destStartTime = destHistoricActivityInstance.getStartTime().getTime();
							long srcEndTime = srcHistoricActivityInstance.getEndTime().getTime();
							long offset = destStartTime - srcEndTime;
							String type = destHistoricActivityInstance.getActivityType();

							if (type != null && type.equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE)) {
								// continue;
								// 不做处理
							} else if ((!destinationFlowId.equals(destHistoricActivityInstance.getActivityId()))
									|| (offset < 0) || (offset > 1000 && !srcHistoricActivityInstance.getActivityType()
											.equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE))) {
								// if(!srcHistoricActivityInstance.getActivityType().equals(BpmnXMLConstants.ELEMENT_GATEWAY_INCLUSIVE)){
								continue;
								// }
							}
							if (!destinationFlowId.equals(destHistoricActivityInstance.getActivityId())) {
								continue;
							}
							drawSequenceFlow(image, processDefinitionId, pvmTransition.getId());
						}
					}
				}
			}
		}
	}

	
	private void addAllActivityImpl(List <ActivityImpl> flowElements,List <ActivityImpl> allFlowElements){
		for (ActivityImpl activityImpl : flowElements) {
			if ("subProcess".equals(activityImpl.getProperty("type"))) {
				allFlowElements.add(activityImpl);
				addAllActivityImpl(activityImpl.getActivities(),allFlowElements);
				continue;
			}
			allFlowElements.add(activityImpl);
		}
	}
	
	
	public void drawSequenceFlow(BufferedImage image,
			String processDefinitionId, String sequenceFlowId) {
		GetBpmnModelCmd getBpmnModelCmd = new GetBpmnModelCmd(
				processDefinitionId);
		BpmnModel bpmnModel = getBpmnModelCmd.execute(Context
				.getCommandContext());

		Graphics2D graphics = image.createGraphics();
		graphics.setPaint(HISTORY_COLOR);
		graphics.setStroke(new BasicStroke(2f));

		try {
			List<GraphicInfo> graphicInfoList = bpmnModel
					.getFlowLocationGraphicInfo(sequenceFlowId);

			int[] xPoints = new int[graphicInfoList.size()];
			int[] yPoints = new int[graphicInfoList.size()];

			for (int i = 1; i < graphicInfoList.size(); i++) {
				GraphicInfo graphicInfo = graphicInfoList.get(i);
				GraphicInfo previousGraphicInfo = graphicInfoList.get(i - 1);

				if (i == 1) {
					xPoints[0] = (int) previousGraphicInfo.getX() - minX;
					yPoints[0] = (int) previousGraphicInfo.getY() - minY;
					//xPoints[0]+=2;
						//	yPoints[0]+=2;
				}

				xPoints[i] = (int) graphicInfo.getX() - minX;
				yPoints[i] = (int) graphicInfo.getY() - minY;
				//xPoints[i]+=5;
				//yPoints[i]+=9;
			}

			int radius = 0;

			Path2D path = new Path2D.Double();

			for (int i = 0; i < xPoints.length; i++) {
				Integer anchorX = xPoints[i];
				Integer anchorY = yPoints[i];

				double targetX = anchorX;
				double targetY = anchorY;

				double ax = 0;
				double ay = 0;
				double bx = 0;
				double by = 0;
				double zx = 0;
				double zy = 0;

				if ((i > 0) && (i < (xPoints.length - 1))) {
					Integer cx = anchorX;
					Integer cy = anchorY;

					// pivot point of prev line
					double lineLengthY = yPoints[i] - yPoints[i - 1];

					// pivot point of prev line
					double lineLengthX = xPoints[i] - xPoints[i - 1];
					double lineLength = Math.sqrt(Math.pow(lineLengthY, 2)
							+ Math.pow(lineLengthX, 2));
					double dx = (lineLengthX * radius) / lineLength;
					double dy = (lineLengthY * radius) / lineLength;
					targetX = targetX - dx;
					targetY = targetY - dy;

					// isDefaultConditionAvailable = isDefault && i == 1 &&
					// lineLength > 10;
					if ((lineLength < (2 * radius)) && (i > 1)) {
						targetX = xPoints[i] - (lineLengthX / 2);
						targetY = yPoints[i] - (lineLengthY / 2);
					}

					// pivot point of next line
					lineLengthY = yPoints[i + 1] - yPoints[i];
					lineLengthX = xPoints[i + 1] - xPoints[i];
					lineLength = Math.sqrt(Math.pow(lineLengthY, 2)
							+ Math.pow(lineLengthX, 2));

					if (lineLength < radius && radius != 0) {
						lineLength = radius;
					}

					dx = (lineLengthX * radius) / lineLength;
					dy = (lineLengthY * radius) / lineLength;

					double nextSrcX = xPoints[i] + dx;
					double nextSrcY = yPoints[i] + dy;

					if ((lineLength < (2 * radius))
							&& (i < (xPoints.length - 2))) {
						nextSrcX = xPoints[i] + (lineLengthX / 2);
						nextSrcY = yPoints[i] + (lineLengthY / 2);
					}

					double dx0 = (cx - targetX) / 3;
					double dy0 = (cy - targetY) / 3;
					ax = cx - dx0;
					ay = cy - dy0;

					double dx1 = (cx - nextSrcX) / 3;
					double dy1 = (cy - nextSrcY) / 3;
					bx = cx - dx1;
					by = cy - dy1;

					zx = nextSrcX;
					zy = nextSrcY;
				}

				if (i == 0) {
					path.moveTo(targetX, targetY);
				} else {
					path.lineTo(targetX, targetY);
				}

				if ((i > 0) && (i < (xPoints.length - 1))) {
					// add curve
					path.curveTo(ax, ay, bx, by, zx, zy);
				}
			}

			graphics.draw(path);

			// draw arrow
			Line2D.Double line = new Line2D.Double(xPoints[xPoints.length - 2],
					yPoints[xPoints.length - 2], xPoints[xPoints.length - 1],
					yPoints[xPoints.length - 1]);

			int ARROW_WIDTH = 5;
			int doubleArrowWidth = 2 * ARROW_WIDTH;
			Polygon arrowHead = new Polygon();
			arrowHead.addPoint(0, 0);
			arrowHead.addPoint(-ARROW_WIDTH, -doubleArrowWidth);
			arrowHead.addPoint(ARROW_WIDTH, -doubleArrowWidth);

			AffineTransform transformation = new AffineTransform();
			transformation.setToIdentity();

			double angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
			transformation.translate(line.x2, line.y2);
			transformation.rotate((angle - (Math.PI / 2d)));

			AffineTransform originalTransformation = graphics.getTransform();
			graphics.setTransform(transformation);
			graphics.fill(arrowHead);
			graphics.setTransform(originalTransformation);
		} finally {
			graphics.dispose();
		}
	}

	/**
	 * 获取流程定义环节定位DIV
	 * 
	 * @param processInstanceId
	 * @return
	 * @throws IOException
	 */
	public String getProcessDefinitionDiv(String processDefinitionId)
			throws IOException {
		ProcessDefinitionEntity definition = Context
				.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		if (definition == null) {
			RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) Context
					.getProcessEngineConfiguration().getRepositoryService();
			definition = (ProcessDefinitionEntity) repositoryServiceImpl
					.getDeployedProcessDefinition(processDefinitionId);

		}
		if (definition == null) {
			return "";
		}
		GetBpmnModelCmd getBpmnModelCmd = new GetBpmnModelCmd(
				processDefinitionId);
		BpmnModel bpmnModel = getBpmnModelCmd.execute(Context
				.getCommandContext());
		Point point = getMinXAndMinY(bpmnModel);
		this.minX = point.x;
		this.minY = point.y;
		this.minX = (this.minX <= 5) ? 5 : this.minX;
		this.minY = (this.minY <= 5) ? 5 : this.minY;
		this.minX -= 5;
		this.minY -= 5;
		StringBuffer buf=new StringBuffer();
		appendProcessDefinitionDiv(definition.getActivities(),buf);
		return buf.toString();
	}

	/**
	 * 获取流程实例已运行及运行时的任务定位DIV
	 * 
	 * @param processInstanceId
	 * @return
	 * @throws IOException
	 */
	public String getHistoryProcessDiv(String processInstanceId)
			throws IOException {
		HistoricProcessInstance historicProcessInstance = Context
				.getCommandContext().getHistoricProcessInstanceEntityManager()
				.findHistoricProcessInstance(processInstanceId);
		String processDefinitionId = historicProcessInstance
				.getProcessDefinitionId();
		GetBpmnModelCmd getBpmnModelCmd = new GetBpmnModelCmd(
				processDefinitionId);
		BpmnModel bpmnModel = getBpmnModelCmd.execute(Context
				.getCommandContext());
		Point point = getMinXAndMinY(bpmnModel);
		this.minX = point.x;
		this.minY = point.y;
		this.minX = (this.minX <= 5) ? 5 : this.minX;
		this.minY = (this.minY <= 5) ? 5 : this.minY;
		this.minX -= 5;
		this.minY -= 5;
		ProcessDefinitionEntity definition = Context
				.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		if (definition == null) {
			RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) Context
					.getProcessEngineConfiguration().getRepositoryService();
			definition = (ProcessDefinitionEntity) repositoryServiceImpl
					.getDeployedProcessDefinition(processDefinitionId);

		}
		HistoricActivityInstanceQueryImpl historicActivityInstanceQueryImpl = new HistoricActivityInstanceQueryImpl();
		historicActivityInstanceQueryImpl.processInstanceId(processInstanceId)
				.orderByHistoricActivityInstanceStartTime().asc();

		Page page = new Page(0, 100);
		List<HistoricActivityInstance> activityInstances = Context
				.getCommandContext()
				.getHistoricActivityInstanceEntityManager()
				.findHistoricActivityInstancesByQueryCriteria(
						historicActivityInstanceQueryImpl, page);
		StringBuffer buf = new StringBuffer();
		for (HistoricActivityInstance historicActivityInstance : activityInstances) {
			String historicActivityId = historicActivityInstance
					.getActivityId();
			ActivityImpl activity = definition.findActivity(historicActivityId);
			if (activity != null) {
				if (taskType.contains(historicActivityInstance
						.getActivityType())) {
					String str = drawTaskDiv(activity, activity.getX()
							- this.minX, activity.getY() - this.minY,
							activity.getWidth(), activity.getHeight(),
							historicActivityInstance.getActivityType(),ProcessDefinitionUtils.isMultiInstance(activity));
					buf.append(str);
				}else if (subProcessType.contains(historicActivityInstance
						.getActivityType())) {
					String str = drawSubProcess(activity, activity.getX()
							- this.minX, activity.getY() - this.minY,
							activity.getWidth(), activity.getHeight(),
							historicActivityInstance
							.getActivityType());
					buf.append(str);
				}
			}
		}
		return buf.toString();
	}
	
	private StringBuffer appendHistoryProcessDiv(List<HistoricActivityInstance> activityInstances,ProcessDefinitionEntity definition,StringBuffer buf){
		for (HistoricActivityInstance historicActivityInstance : activityInstances) {
			String historicActivityId = historicActivityInstance
					.getActivityId();
			ActivityImpl activity = definition.findActivity(historicActivityId);
			if (activity != null) {
				if (taskType.contains(historicActivityInstance
						.getActivityType())) {
					String str = drawTaskDiv(activity, activity.getX()
							- this.minX, activity.getY() - this.minY,
							activity.getWidth(), activity.getHeight(),
							historicActivityInstance.getActivityType(),ProcessDefinitionUtils.isMultiInstance(activity));
					buf.append(str);
				}else if (subProcessType.contains(historicActivityInstance
						.getActivityType())) {
					appendHistoryProcessDiv(activityInstances,definition,buf);
				}
			}
		}
		return buf;
	}
	private StringBuffer appendProcessDefinitionDiv(List<ActivityImpl> actactivitys,StringBuffer buf){
		for (ActivityImpl activity : actactivitys) {
			if (activity != null) {
				String activityType = (String) activity.getProperty("type");
				if (taskType.contains(activityType)||gatewayType.contains(activityType)) {
					String str = drawTaskDiv(activity, activity.getX()
							- this.minX, activity.getY() - this.minY,
							activity.getWidth(), activity.getHeight(),
							activityType,ProcessDefinitionUtils.isMultiInstance(activity));
					buf.append(str);
					/*String strDescrip = drawTaskDescriptionDiv(activity,minX,minY);
					buf.append(strDescrip);*/
				}else if (subProcessType.contains(activityType)) {
					appendProcessDefinitionDiv(activity.getActivities(),buf);
				}
			}
		}
		return buf;
	}
	/**
	 * 拼线的坐标
	 * @param activity
	 * @param string 
	 * @param sort 
	 * @param activityInstanceMaps 
	 * @param activityInstances 
	 * @return
	 */
	private Map<String, Object> appendLine(ActivityImpl activity, int sort, String type, Map<String, HistoricActivityInstance> activityInstanceMaps, List<HistoricActivityInstance> activityInstances) {
		Map<String,Object> obj = new HashMap<String, Object>();
		List<PvmTransition> line = new ArrayList<PvmTransition>();
		if(type.equals("other")){
			line=activity.getIncomingTransitions();
		}else{
			line=activity.getOutgoingTransitions();
		}
		
		obj.put("type","line");
		obj.put("id", line.get(0).getId());
		obj.put("sn", sort);
		List<Map<String,Object>> points  = new ArrayList<Map<String,Object>>();
		line:
		for (PvmTransition pvmTransition : line) {
			TransitionImpl wars = (TransitionImpl) pvmTransition;
			for (HistoricActivityInstance history: activityInstances) {
				HistoricActivityInstanceEntity entity =(HistoricActivityInstanceEntity) history;
				if(entity.getActivityId().equals(activity.getId())){
					String str = "";
					if(entity.getPreActId() != null){
						str =wars.getDestination().getId().toString() + wars.getSource().getId().toString();
					}else{
						str = wars.getSource().getId().toString();
					}
					if(activityInstanceMaps.get(str) != null && type.equals("other")){
						List<Integer> way = wars.getWaypoints();
						Map<String,Object> xyPoint = new HashMap<String,Object>();
						for (int i = 0; i < way.size(); i++) {
							if(i%2==0){
								xyPoint.put("x", way.get(i)-this.minX);
							}else{
								xyPoint.put("y", way.get(i)-this.minY);
								points.add(xyPoint);
								xyPoint= new HashMap<String,Object>();
							}
							
						}
						break line;
					}
				}
			}
			
		}
		obj.put("points", points);
		return obj;
	}
	/**
	 * 环节图形坐标
	 * @param activity
	 * @param sort
	 * @return
	 */
	private Map<String, Object> appendImg(ActivityImpl activity, int sort) {
		Map<String,Object> obj = new HashMap<String, Object>();
		obj.put("type",activity.getProperty("type"));
		obj.put("id", activity.getId());
		obj.put("width", activity.getWidth());
		obj.put("height", activity.getHeight());
		obj.put("x", activity.getX() - this.minX);
		obj.put("y", activity.getY() - this.minY);
		obj.put("isMulti", ProcessDefinitionUtils.isMultiInstance(activity));
		obj.put("sn", sort);
		return obj;
	}

	private StringBuffer appendHistoryProcessDiv(List<ActivityImpl> actactivitys,StringBuffer buf){
		for (ActivityImpl activity : actactivitys) {
			if (activity != null) {
				String activityType = (String) activity.getProperty("type");
				if (taskType.contains(activityType)) {
					String str = drawTaskDiv(activity, activity.getX()
							- this.minX, activity.getY() - this.minY,
							activity.getWidth(), activity.getHeight(),
							activityType,ProcessDefinitionUtils.isMultiInstance(activity));
					buf.append(str);
				}else if (subProcessType.contains(activityType)) {
					appendProcessDefinitionDiv(activity.getActivities(),buf);
				}
			}
		}
		return buf;
	}

	/**
	 * 绘制任务Div
	 */
	protected static String drawTaskDiv(ActivityImpl activity, int x, int y,
			int width, int height, String activityType,boolean isMulti) {
		StringBuffer buf = new StringBuffer();
		buf.append("<div id='" + activity.getId() + "' class='flowNode' type='"
				+ activityType + "' ");
		if(activityType.equals("callActivity")){
			String callActivityProcDefKey="";
			//普通子流
			if(activity.getActivityBehavior() instanceof CallActivityBehavior){
				callActivityProcDefKey=((CallActivityBehavior) activity
						.getActivityBehavior()).getProcessDefinitonKey();
			}else if(activity.getActivityBehavior() instanceof ParallelMultiInstanceBehavior){//多实例子流
				callActivityProcDefKey=((CallActivityBehavior) ((ParallelMultiInstanceBehavior) activity
						.getActivityBehavior()).getInnerActivityBehavior()).getProcessDefinitonKey();
			}
			if(activity.getProperty("activityDefChildType")!=null){
				buf.append(" activityDefChildType='"+activity.getProperty("activityDefChildType")+"' ");
			}
			buf.append("callActivity='"+callActivityProcDefKey+"' ");
			
		}if(isMulti){
			buf.append(" isMulti='true' ");
		}
		buf.append("style='position:absolute;z-index:10; ");
		buf.append("left:" + x + "px;top:" + y + "px;width:" + width
				+ "px;height:" + height + "px;' oldtitle='"
				+ activity.getProperty("name") + "'>");
		buf.append("</div>");
		return buf.toString();

	}
	/**
	 * 输出线名称div
	 * @param activity
	 * @param minX
	 * @param minY
	 * @return
	 */
	protected static String drawTaskDescriptionDiv(ActivityImpl activity,int minX, int minY) {
		List<PvmTransition> line = new ArrayList<PvmTransition>();
		String activityType = (String) activity.getProperty("type");
		if(activityType.contains("startEvent")){
			line=activity.getIncomingTransitions();
		}else{
			line=activity.getOutgoingTransitions();
		}
		StringBuffer buf = new StringBuffer();
		for (PvmTransition pvmTransition : line) {
			TransitionImpl wars = (TransitionImpl) pvmTransition;
			if(wars.getProperty("name") !=null && wars.getProperty("name").toString().length()>4){
				buf.append("<div id='" + wars.getId().toString() + "' class='flowNode' type='description' ");
				List<Integer> way = wars.getWaypoints();
				int x = 0;
				int y = 0;
				int top =-15;
				int x1=0;
				if(way.get(1).equals(way.get(way.size()-1))){//判断是否是同一水平线
					if(way.get(0)<way.get(way.size()-2)){//判断是否是反向的输出线
						top=15;
						x1=25;
					}else{
						top=15;
					}				
				}
				if(way.get(1)<way.get(way.size()-1)){
					top=25;
				}
				for (int i = 0; i < way.size(); i++) {
					if(i%2==0){
						x=(way.get(i)-minX)-x1;
					}else{
						y=way.get(i)-minY-top;
					}
					
				}
				buf.append("style='text-align:center; position:absolute;z-index:10; ");
				buf.append("left:" + x+ "px;top:" + y + "px;' oldtitle='"
					+ wars.getProperty("name") + "'><img src='./resource/css/images/help.png'/>");
				buf.append("</div>");
			}
		}
		return buf.toString();

	}
	
	/**
	 * 绘制子流程
	 */
	protected static String drawSubProcess(ActivityImpl activity, int x,int y, int width, int height,String activityType) {
		StringBuffer buf = new StringBuffer();
		buf.append("<div id='" + activity.getId() + "' class='flowNode' type='"
				+ activityType + "' ");
		buf.append("style='position:absolute;z-index:10; ");
		buf.append("left:" + (x + 1) + "px;top:" + (y + 1) + "px;width:" + (width - 2)
				+ "px;height:" + (height - 2) + "px;' oldtitle='"
				+ activity.getProperty("name") + "'>");
		buf.append("</div>");
		return buf.toString();
	}

	public Map<String, Object> getProcessHistoryDiv(String processInstanceId) {
		HistoricProcessInstance historicProcessInstance = Context
				.getCommandContext().getHistoricProcessInstanceEntityManager()
				.findHistoricProcessInstance(processInstanceId);
		String processDefinitionId = historicProcessInstance
				.getProcessDefinitionId();
		GetBpmnModelCmd getBpmnModelCmd = new GetBpmnModelCmd(
				processDefinitionId);
		BpmnModel bpmnModel = getBpmnModelCmd.execute(Context
				.getCommandContext());
		Point point = getMinXAndMinY(bpmnModel);
		this.minX = point.x;
		this.minY = point.y;
		this.minX = (this.minX <= 5) ? 5 : this.minX;
		this.minY = (this.minY <= 5) ? 5 : this.minY;
		this.minX -= 5;
		this.minY -= 5;
		ProcessDefinitionEntity definition = Context
				.getProcessEngineConfiguration().getProcessDefinitionCache()
				.get(processDefinitionId);
		if (definition == null) {
			RepositoryServiceImpl repositoryServiceImpl = (org.activiti.engine.impl.RepositoryServiceImpl) Context
					.getProcessEngineConfiguration().getRepositoryService();
			definition = (ProcessDefinitionEntity) repositoryServiceImpl
					.getDeployedProcessDefinition(processDefinitionId);

		}
		HistoricActivityInstanceQueryImpl historicActivityInstanceQueryImpl = new HistoricActivityInstanceQueryImpl();
		historicActivityInstanceQueryImpl.processInstanceId(processInstanceId)
				.orderByHistoricActivityInstanceStartTime().asc();

		Page page = new Page(0, 100);
		List<HistoricActivityInstance> activityInstances = Context
				.getCommandContext()
				.getHistoricActivityInstanceEntityManager()
				.findHistoricActivityInstancesByQueryCriteria(
						historicActivityInstanceQueryImpl, page);
		StringBuffer buf = new StringBuffer();
		return appendProcessHistoryDiv(activityInstances,buf,definition,historicProcessInstance);
	}

	private Map<String, Object> appendProcessHistoryDiv(List<HistoricActivityInstance> activityInstances, StringBuffer buf, ProcessDefinitionEntity definition, HistoricProcessInstance historicProcessInstance) {
		Map<String,HistoricActivityInstance> activityInstanceMaps = this.getHistoricActivityInstance(activityInstances);
		List<Map<String,Object>> list = new ArrayList<Map<String,Object>>();
		int sort = 2;
		for (HistoricActivityInstance historicActivityInstance : activityInstances) {
			String historicActivityId = historicActivityInstance
					.getActivityId();
			ActivityImpl activity = definition.findActivity(historicActivityId);
			if (activity != null) {
				String activityType = (String) activity.getProperty("type");
				Map<String,Object> obj = new HashMap<String, Object>();
				if(!activityType.contains("startEvent")){//除去开始、结束，获取其他环节的线坐标
					sort++;
					obj = this.appendLine(activity,sort,"other",activityInstanceMaps,activityInstances);
					list.add(obj);
				}
				if (taskType.contains(activityType)||gatewayType.contains(activityType)) {
					String str = drawTaskDiv(activity, activity.getX()
							- this.minX, activity.getY() - this.minY,
							activity.getWidth(), activity.getHeight(),
							activityType,ProcessDefinitionUtils.isMultiInstance(activity));
					buf.append(str);
					sort++;
					obj = this.appendImg(activity,sort);
					list.add(obj);
				}else if(activityType.contains("startEvent")){
					obj = this.appendImg(activity,0);
					list.add(obj);
					obj=null;
					obj = this.appendLine(activity,1,"start",activityInstanceMaps,activityInstances);
					list.add(obj);
				}else if(activityType.contains("endEvent")){
					sort++;
					obj = this.appendImg(activity,sort);
					list.add(obj);
				}
			}
		}
		Map<String,Object> obj = new HashMap<String, Object>();
		obj.put("divContent", buf);
		obj.put("historyTrackList", list);
		return obj;
	}
	
	private Map<String,HistoricActivityInstance> getHistoricActivityInstance(List<HistoricActivityInstance> activityInstances){
		Map<String,HistoricActivityInstance> activityInstanceMaps=new HashMap<String,HistoricActivityInstance>();
		for (HistoricActivityInstance history : activityInstances) {
			HistoricActivityInstanceEntity entity = (HistoricActivityInstanceEntity)history;
			activityInstanceMaps.put(entity.getActivityId()+(entity.getPreActId()!=null?entity.getPreActId():""), entity);
		}
		return activityInstanceMaps;
		
	}

}
