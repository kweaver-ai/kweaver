package com.aishu.wf.core.anyshare.client;

import javax.net.ssl.*;
import java.security.SecureRandom;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

/**
 * @description 信任管理器
 * @author hanj
 */
public class TrustAll {
	public static SSLSocketFactory socketFactory() {
		SSLSocketFactory ssfFactory = null;

		try {
			SSLContext sc = SSLContext.getInstance("TLS");
			sc.init(null, new TrustManager[] { new trustManager() }, new SecureRandom());

			ssfFactory = sc.getSocketFactory();
		} catch (Exception e) {
		}

		return ssfFactory;
	}

	public static class hostnameVerifier implements HostnameVerifier {
		@Override
		public boolean verify(String hostname, SSLSession session) {
			return true;
		}
	}

	public static class trustManager implements X509TrustManager, TrustManager {
		@Override
		public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
		}

		@Override
		public void checkClientTrusted(X509Certificate[] x509Certificates, String s) throws CertificateException {

		}

		@Override
		public X509Certificate[] getAcceptedIssuers() {
			return new X509Certificate[0];
		}
	}
}
