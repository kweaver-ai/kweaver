package com.aishu.wf.core.common.util;



import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.StringTokenizer;


public class StringUtils {

	public static boolean isNull(Object obj) {
		return obj == null ? true : false;
	}

	public static boolean isNull(String str) {
		return (null == str || "".equals(str.trim())) ? true : false;
	}

	public static boolean isNotNull(Object obj) {
		return obj != null ? true : false;
	}

	public static Integer checkInteger(Integer number) {

		return number == null ? 0 : number;
	}

	public static Double checkDouble(Double number) {
		return number == null ? 0 : number;
	}

	public static Long checkLong(Long number) {
		return number == null ? 0 : number;
	}

	public static boolean isNotNull(String str) {
		return (null != str && !"".equals(str.trim()) && !"null".equals(str)) ? true
				: false;
	}

	public static boolean isNotNull(int obj) {
		return obj != 0 ? true : false;
	}

	public static boolean isNotBlank(String str) {
		return (str != null && !str.trim().equals("")) ? true : false;
	}

	public static boolean isEmpty(String str) {
		return (str == null || str.length() == 0) ? true : false;
	}

	public static String replaceNull(String str) {
		return (str == null||(null!=str&&"null".equalsIgnoreCase(str))) ? str = "" : str;
	}

	public static String[] spit(String source, String demiliter) {
		String[] strs = null;
		if (source != null && !"".equals(source)) {
			StringTokenizer st = new StringTokenizer(source, demiliter);
			strs = new String[st.countTokens()];
			int i = 0;
			while (st.hasMoreTokens()) {
				strs[i] = st.nextToken();
				i++;
			}
		}
		return strs;
	}

	public static List spitList(String source, String demiliter) {
		String[] arrays = spit(source, demiliter);
		return (arrays != null) ? Arrays.asList(spit(source, demiliter))
				: new ArrayList();
	}

	public static int count(String str, String text) {
		if (str == null || text == null) {
			return 0;
		}
		int pos = str.indexOf(text);
		int count = 0;
		while (pos != -1) {
			pos = str.indexOf(text, pos + text.length());
			count++;
		}
		return count;
	}

	public static String merge(String[] arrays, String delimiter) {
		StringBuffer buffer = new StringBuffer();
		for (int i = 0; i < arrays.length; i++) {
			buffer.append(arrays[i]);
			if (i + 1 != arrays.length) {
				buffer.append(delimiter);
			}
		}
		return buffer.toString();
	}

	public static String toUtf8String(String s) {
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (c >= 0 && c <= 255) {
				sb.append(c);
			} else {
				byte[] b;
				try {
					b = Character.toString(c).getBytes("utf-8");
				} catch (Exception ex) {
					b = new byte[0];
				}
				for (int j = 0; j < b.length; j++) {
					int k = b[j];
					if (k < 0)
						k += 256;
					sb.append("%" + Integer.toHexString(k).toUpperCase());
				}
			}
		}
		return sb.toString();
	}

	public static String toGBKString(String str){
		if(StringUtils.isNotNull(str)){
			try {
				return new String(str.getBytes("ISO8859-1"),"GBK");
			} catch (UnsupportedEncodingException e) {
			}
		}
		return str;

	}



	public static boolean isFullNotNull(String[] str) {
		boolean flag = false;
		if (str != null && str.length > 0) {
			for (int i = 0; i < str.length; i++) {
				if (!isNotNull(str[i])) {
					return flag;
				}
			}
			flag = true;
		}
		return flag;
	}


	public static boolean hasLength(String str) {
		return (str != null && str.length() > 0) ? true : false;
	}

	/**
	 * ??????regex?o?split????,??????source???StringTokenizer4??? ?o??????????.
	 * ????source;source;source;
	 *
	 */
	public static String[] split(String source, String regex) {
		String[] strs = null;
		if (source != null && !"".equals(source)) {
			StringTokenizer st = new StringTokenizer(source, regex);
			strs = new String[st.countTokens()];
			int i = 0;
			while (st.hasMoreTokens()) {
				strs[i] = st.nextToken();
				i++;
			}
		}
		return strs;
	}

	public static void assertParams(String str) {
		if (str == null && "".equals(str)) {
			throw new IllegalArgumentException("??????????null?????");
		}
	}

	public static boolean matching(String[] strs, String str) {
		if (strs == null) {
			return false;
		}
		if (str == null) {
			return false;
		}

		boolean flag = false;
		for (int i = 0; i < strs.length; i++) {
			if (str.equals(strs[i])) {
				flag = true;
				break;
			}
		}
		return flag;
	}

	public static String[] filtrate(String[] strs1, String[] strs2) {
		Set hashSet = new HashSet();
		if (!((strs1 == null) || (strs2 == null))) {
			hashSet.addAll(Arrays.asList(strs1));
			hashSet.addAll(Arrays.asList(strs2));
		}
		return (String[]) hashSet.toArray(new String[]{});
	}

	public String[] uniteArray(String[] a, String[] b) {
		String[] strs = null;
		if (a != null && a.length > 0 && b != null && b.length > 0) {
			int aLength = a.length;
			int bLength = b.length;
			strs = new String[aLength + bLength];
			for (int i = 0; i < aLength; i++) {
				strs[i] = a[i];
			}
			for (int i = 0; i < bLength; i++) {
				strs[aLength + i] = b[i];
			}
		}
		return strs;
	}

	public static String toGBK(String str) {
		String gbkStr = "";
		if (isNotNull(str)) {
			try {
				gbkStr = new String(str.getBytes("ISO-8859-1"), "GBK");
			} catch (UnsupportedEncodingException e) {
			}
		}
		return gbkStr;
	}
	public static String getIdentityId(String userId) {
		Date now = new Date();
		Calendar calendar = new GregorianCalendar();
		calendar.setTime(now);
		return userId + String.valueOf(calendar.get(Calendar.YEAR))
				+ String.valueOf(calendar.get(Calendar.MONTH) + 1)
				+ String.valueOf(calendar.get(Calendar.DATE))
				+ String.valueOf(calendar.get(Calendar.HOUR))
				+ String.valueOf(calendar.get(Calendar.MINUTE))
				+ String.valueOf(calendar.get(Calendar.SECOND));

	}

	/**
	 * public static String getIdentityId(String userId) { java.util.Date dt=new
	 * java.util.Date(); java.text.SimpleDateFormat datetime=new
	 * java.text.SimpleDateFormat("yyyyMMddHHmmss"); String
	 * time=datetime.format(dt); return userId+time; }
	 */
	public static String getViewStrByFieldsXml(String fieldsXml,
			String startStr, String endStr) {
		String text99 = "";
		if (fieldsXml != null && !("".equals(fieldsXml))) {
			int start = fieldsXml.lastIndexOf(startStr);
			int end = fieldsXml.lastIndexOf(endStr);
			if (start >= 0 && end > start) {
				text99 = fieldsXml.substring(start + startStr.length(), end);
			}
		}
		return text99;
	}

	/**kpi锟斤拷锟斤拷锟斤拷指锟斤拷锟斤拷锟斤拷要去锟斤拷小锟斤拷锟斤拷锟?  */
	public static String checkDoublePoint(Double number) {
		String doublePoint="";
		if(number==null){
			return doublePoint;
		}else if(number>0){
			doublePoint=String.valueOf(number);
			if(doublePoint.indexOf(".")>0){
				doublePoint=doublePoint.substring(doublePoint.lastIndexOf(".")+1,doublePoint.length());
				if(doublePoint.equals("0")){
					String indexNumber=String.valueOf(number);
					doublePoint=indexNumber.substring(0,indexNumber.lastIndexOf("."));
				}else{
					return String.valueOf(number);
				}
			}
		}
		return doublePoint;
	}

	// 判断当前地址是不是ipv6格式
	public static boolean isIPv6(String address) {
		int count = address.split(String.valueOf(":"), -1).length - 1;
		if (count >= 2) {
			return true;
		}
		return false;
	}
}
