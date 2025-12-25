package com.aishu.wf.core.common.util;
import org.apache.commons.beanutils.Converter;

public final class StringConverter implements Converter {

	public StringConverter() {
	}

	public Object convert(Class type, Object value) {
		if (value == null || "".equals(value.toString())) {
			return (String) null;
		} else {
			return value.toString();
		}
	}
}

