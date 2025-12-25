package com.aishu.wf.core.common.util;

import java.text.SimpleDateFormat;


import org.apache.commons.beanutils.Converter;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;


public class DateConverter implements Converter{
	private static final Log log=LogFactory.getLog(DateConverter.class);
	private SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd");
	public DateConverter(String formatPattern){
		if(StringUtils.isNotBlank(formatPattern)){
			format=new SimpleDateFormat(formatPattern);
		}
	}
	public Object convert(Class arg0, Object value) {
		try{
			String dateStr=(String)value;
			if(StringUtils.isNotBlank(dateStr)){
				return format.parseObject(dateStr);
			}
		}catch(Exception e){
			log.warn(e.getMessage(),e);
		}
		return null;
	}

}
