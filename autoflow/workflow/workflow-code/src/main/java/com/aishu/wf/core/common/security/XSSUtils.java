package com.aishu.wf.core.common.security;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.owasp.esapi.ESAPI;

public class XSSUtils {

	public static String stripXSS(String value) {
		if (value == null) {
			return null;
		}
		try {
			value = ESAPI.encoder().canonicalize(value).replaceAll("\0", "");
		} catch (Exception e) {
		}
		return Jsoup.clean(value, "", getWhitelist(), new Document.OutputSettings().prettyPrint(false));
	}

	private static Safelist getWhitelist() {
		return new Safelist()
				.addTags("br"); // 审核意见可以输入换行符
	}

}
