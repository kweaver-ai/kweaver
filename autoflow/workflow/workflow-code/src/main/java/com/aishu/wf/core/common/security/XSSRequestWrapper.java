package com.aishu.wf.core.common.security;

import static com.aishu.wf.core.common.security.XSSUtils.stripXSS;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import org.apache.commons.codec.Charsets;
import org.apache.commons.io.IOUtils;

public class XSSRequestWrapper extends HttpServletRequestWrapper {

	private byte[] rawData;
	private HttpServletRequest request;
	private ResettableServletInputStream servletStream;

	public XSSRequestWrapper(HttpServletRequest request) {
		super(request);
		this.request = request;
		this.servletStream = new ResettableServletInputStream();
	}

	public void resetInputStream(byte[] newRawData) {
		rawData = newRawData;
		servletStream.stream = new ByteArrayInputStream(newRawData);
	}

	@Override
	public ServletInputStream getInputStream() throws IOException {
		if (rawData == null) {
			rawData = IOUtils.toByteArray(this.request.getReader(), Charsets.UTF_8);
			servletStream.stream = new ByteArrayInputStream(rawData);
		}
		return servletStream;
	}

	@Override
	public BufferedReader getReader() throws IOException {
		if (rawData == null) {
			rawData = IOUtils.toByteArray(this.request.getReader(), Charsets.UTF_8);
			servletStream.stream = new ByteArrayInputStream(rawData);
		}
		return new BufferedReader(new InputStreamReader(servletStream));
	}

	private class ResettableServletInputStream extends ServletInputStream {

		private InputStream stream;

		@Override
		public int read() throws IOException {
			return stream.read();
		}

		@Override
		public boolean isFinished() {
			return false;
		}

		@Override
		public boolean isReady() {
			return false;
		}

		@Override
		public void setReadListener(ReadListener readListener) {

		}
	}

	@Override
	public String[] getParameterValues(String parameter) {
		String[] values = super.getParameterValues(parameter);
		if (values == null) {
			return null;
		}
		int count = values.length;
		String[] encodedValues = new String[count];
		for (int i = 0; i < count; i++) {
			encodedValues[i] = stripXSS(values[i]);
		}
		return encodedValues;
	}

	@Override
	public String getParameter(String parameter) {
		String value = super.getParameter(parameter);
		return stripXSS(value);
	}

	@Override
	public String getHeader(String name) {
		String value = super.getHeader(name);
		return stripXSS(value);
	}

	@Override
	public Enumeration<String> getHeaders(String name) {
		List<String> result = new ArrayList<>();
		Enumeration<String> headers = super.getHeaders(name);
		while (headers.hasMoreElements()) {
			String header = headers.nextElement();
			String[] tokens = header.split(",");
			for (String token : tokens) {
				// 客户端Cookie中存在client.origin_uri无法通过XSS校验，导致请求异常；该值在AS中定义，故屏蔽该校验
				if (token.indexOf("uri") > -1) {
					continue;
				}
				if (token.indexOf("login_account") > -1) {
					continue;
				}
				result.add(stripXSS(token));
			}
		}
		return Collections.enumeration(result);
	}

}
