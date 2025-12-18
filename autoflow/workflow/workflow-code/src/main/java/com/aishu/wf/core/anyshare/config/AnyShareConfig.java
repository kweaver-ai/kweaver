package com.aishu.wf.core.anyshare.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @description 爱数相关配置类
 * @author hanj
 */
@Data
@Component
@ConfigurationProperties(prefix = "anyshare")
public class AnyShareConfig {

	/** AnyShare 语言环境 */
	private String language;

	/** AnyShare【userManagement】 api地址 */
	private String userManagementPoint;

	/** AnyShare【eacp】 api地址 */
	private String eacpPoint;

	/** AnyShare【hydra】 api地址 */
	private String hydraAdminPoint;

	/** AnyShare【efast】 api地址 */
	private String efastPoint;

	/** AnyShare【docset】 api地址 */
	private String docsetPoint;

	/** AnyShare【deploy-service】 api地址 */
	private String deployServicePoint;

	/** AnyShare【document】 api地址 */
	private String documentPoint;

	/** AnyShare【appstore】 api地址 */
	private String appstorePoint;

	/** AnyShare【doc-share-public】 api地址 */
	private String docsharePublicPoint;

	/** AnyShare【personal-config-private】 api地址 */
	private String personalConfigPoint;

	/** AnyShare【doc-share-private api地址 */
	private String docsharePrivatePoint;

	/** AnyShare [message-private] api 地址 */
	private String messagePrivatePoint;

	/** AnyShare【kc-mc-private】 api地址 */
	private String kcMcPrivatePoint;

}
