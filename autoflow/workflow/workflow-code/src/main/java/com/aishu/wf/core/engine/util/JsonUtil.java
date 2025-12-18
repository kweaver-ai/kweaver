package com.aishu.wf.core.engine.util;

import java.io.StringWriter;

import com.aishu.wf.core.engine.core.model.ProcessInstanceModel;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;


public class JsonUtil {
	
	public static String convertToJson(Object bean) {
		StringWriter sw = new StringWriter();
		try{
		
		ObjectMapper mapper = new ObjectMapper();
		mapper.configure(SerializationFeature.WRITE_ENUMS_USING_INDEX,true);  
		JsonGenerator gen = new JsonFactory().createGenerator(sw);
		mapper.writeValue(gen, bean);
		}catch(Exception e){
		}
		return sw.toString();
	}
	

	public static Object convertToBean(String jsonStr, Class clas) {
		Object bean = null;
		try {
			ObjectMapper mapper = new ObjectMapper();
			bean = mapper.readValue(jsonStr, clas);
		} catch (Exception e) {
		}
		return bean;
	}
}
