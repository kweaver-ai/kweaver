package com.aishu.wf.core.common.util;

import java.io.File;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * String tool
 * 字符串操作工具类,不依赖任何第三方类库</br> 
 * Creator: eddie</br> 
 * Mender:  eddie</br>
 *   
 * @version 1.0.0  
 *
 */
public final class ST {
	private final static String NULL_STRING = "\\s+";
    private final static Pattern pn = Pattern.compile(NULL_STRING);
    
    private ST(){}
    
    public static void main(String[] args) {
	}

    /**
     * 检查对象是否不为空或空字符串
     * @param txt
     * @return
     */
    public static boolean isNotNull(String txt) {
    	return !isNull(txt);
    }
    
    /**
     * 检查对象是否不为空
     * @param obj
     * @return
     */
    public static boolean isNotNull(Object obj) {
    	return !isNull(obj);
    }
    
    /**
     * 检查对象是否为空或空字符串
     * @param txt
     * @return boolean
     */
    public static boolean isNull(String txt)
    {
    	return (txt == null || txt.length() == 0) || pn.matcher(txt).matches();
    }
    
    /**
     * 检查对象是否为空
     * @param obj
     * @return boolean
     */
    public static boolean isNull(Object obj)
    {
    	if (obj == null) {
    		return true;
    	} else if (String.class.isInstance(obj)) {
    		return isNull((String)obj);
    	} else {
    		return false;
    	}
    }
    
    /**
     * 安全方法,如果对象为空或空字符串，将其转化为指定的值
     * @param str：要转换的对象
     * @param value：转换的值
     * @return String
     */
    public static String getDefault(String str,String value)
    {
    	return isNull(str) ? value : str;
    }
    
    /**
     * 三元运算符计算，当str1等于str2时，方法返回str3,否则返回str4
     * getDefault  
     * @param str1
     * @param str2
     * @param str3
     * @param str4
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public static String getDefault(String str1,String str2, String str3,String str4)
    {
    	return equals(str1, str2) ? str3 : str4;
    }
    
    /**
     * 安全方法,将一个字符串转换为一个数字
     * converStringToInt  
     * @param str,要转换的字符串
     * @param defNum,默认返回值
     * @return    
     * int   
     * @exception    
     * @since  1.0.0
     */
    public static int getDefaultToInt(String str,int defNum) {
    	if (isNull(str))
    		return defNum;
    	int result = defNum;
    	try {
    		result = Integer.valueOf(str).intValue();
    	} catch (NumberFormatException e) {
    	}
    	return result;
    }
    
    /**
     * 比较两个对象是否不相等,首先判断是否为同一类型；</br>
     * 其次判断是否为字符串型，如果为字符串型则判断两个字符串的值是否相等(大小写敏感),</br>
     * 不为字符串型则调用Object.equals()方法比较两个对象。</br>
     * 当obj1或obj2的值为null时，返回false。
     * @param obj1
     * @param obj2
     * @return
     */
    public static boolean notEquals(Object obj1,Object obj2) {
    	return !equals(obj1, obj2);
    }
    
    /**
     * 比较两个对象是否相等,首先判断是否为同一类型；</br>
     * 其次判断是否为字符串型，如果为字符串型则判断两个字符串的值是否相等(大小写敏感),</br>
     * 不为字符串型则调用Object.equals()方法比较两个对象。</br>
     * 当obj1或obj2的值为null时，返回false。
     * @param obj1
     * @param obj2
     * @return
     */
    public static boolean equals(Object obj1,Object obj2) {
    	if (obj1 == null || obj2 == null) {
    		return false;
    	}
    	if (obj1.getClass() != obj2.getClass())
    		return false;
    	else if (String.class.isInstance(obj1)) {
    		return equals((String)obj1,(String)obj2);
    	} else
    		return obj1.equals(obj2);
    }
    
    /**
     * 检查两个字符串是否不相等,当txt1或txt2值为null时,返回true
     * @param txt1
     * @param txt2
     * @param flag: 1.true(忽略大小写) 2.false(大小写敏感)
     * @return boolean
     */
    public static boolean notEquals(String txt1,String txt2,boolean isIgnoreCase) {
    	return !equals(txt1,txt2,isIgnoreCase);
    }
    
    /**
     * 检查两个字符串是否相等,当txt1或txt2值为null时,返回false
     * @param txt1
     * @param txt2
     * @param flag: 1.true(忽略大小写) 2.false(大小写敏感)
     * @return boolean
     */
    public static boolean equals(String txt1,String txt2,boolean isIgnoreCase) {
    	if (txt1 == null || txt2 == null) {
    		return false;
    	}
    	if (txt1.equals(txt2)) {
			return true;
		}
        if (isIgnoreCase)
        {
            txt1 = txt1.toLowerCase(Locale.getDefault());
            txt2 = txt2.toLowerCase(Locale.getDefault());
        }
        return txt1.intern().equals(txt2.intern());
    }
    
    /**
     * 检查两个字符串是否不相等,当txt1或txt2值为null时,返回true
     * @param txt1
     * @param txt2
     * @return
     */
    public static boolean notEquals(String txt1,String txt2) {
    	return !equals(txt1,txt2);
    }
    
    /**
     * 检查两个字符串是否相等,当txt1或txt2值为null时,返回false
     * @param txt1
     * @param txt2
     * @return boolean
     */
    public static boolean equals(String txt1,String txt2)
    {
    	return equals(txt1,txt2,false);
    }
    
    /**
     * 从一个文件路径中获取文件名称
     * getFileName  
     * @param filePath
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public static String getFileName(String filePath) {
    	int position1 = filePath.lastIndexOf("\\");
    	int position2 = filePath.lastIndexOf("/");
    	if (position1 != -1 && position1 > position2) {
    		return filePath.substring(position1 + 1);
    	} else if (position2 != -1 && position2 > position1) {
    		return filePath.substring(position2 + 1);
    	} else {
    		return filePath;
    	}
    }
    
    /**
     * 为文件路径拼接一个文件分隔符
     * concatSeparator  
     * @param filePath
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public static String concatSeparator(String filePath) {
    	if (!isNull(filePath)) {
    		filePath += (filePath.lastIndexOf(File.separator) == filePath.length()-1) ? "" : File.separator; 
    	}
    	return filePath;
    }
    
    /**
     * 获取文件扩展名
     * getExtensionName  
     * @param file
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public static String getExtensionName(File file) {
    	String fileName = file.getName();
    	if (fileName.indexOf(".") != -1) {
    		int beginIndex = fileName.lastIndexOf(".");
    		return fileName.substring(beginIndex == fileName.length() ? 0 : beginIndex + 1,fileName.length());
    	} else {
    		return fileName;
    	}
    }
    
    /**
     * 将一个字符串转型为该字符串字面量类型
     * castStr  
     * @param clazz
     * @param obj
     * @return    
     * Object   
     * @exception    
     * @since  1.0.0
     */
    public static Object castStr(Class<?> clazz,String obj) {
    	if (clazz.toString().equals("int") || clazz.equals(Integer.class)) {
    		return Integer.valueOf(obj);
    	} else if (clazz.toString().equals("long") || clazz.equals(Long.class)) {
    		return Long.valueOf(obj);
    	} else if (clazz.toString().equals("float") || clazz.equals(Float.class)) {
    		return Float.valueOf(obj);
    	} else if (clazz.toString().equals("double") || clazz.equals(Double.class)) {
    		return Double.valueOf(obj);
    	} else if (clazz.equals(Class.class)) {
    		return clazz.toString();
    	} else {
    		return obj;
    	}
    }
    
    /**
     * 将一个字符串数组转换为一个字符串
     * getRangeStr  
     * @param arr
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public static String getRangeStr(String[] arr) {
    	return getRangeStr(arr,"(",")");
	}
    
    /**
     * 将一个字符串数组转换为一个字符串
     * getRangeStr  
     * @param idList
     * @param str1,生成后的字符串前缀
     * @param str2,生成后的字符串后缀
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public static String getRangeStr(String[] arr,String str1,String str2) {
		return Arrays.toString(arr)
		  		     .replaceAll("\\[", getDefault(str1,""))
		  			 .replaceAll("\\]", getDefault(str2,""))
		  			 .replaceAll("\\s", "");
	}
    
    /**
     * 将一段字符串中的特殊字符转移为</br>
     * 符合xml规范要求的符号</br>
     * "&-&amp;"</br>
     * "\-&quot;"</br>
     * "'-&apos;"</br>
     * "<-&lt;"</br>
     * ">-&gt;"</br>
     * @param xmlText
     * @return
     */
    public static String escapeXml(String xmlText) {
    	return xmlText.replaceAll("&", "&amp;")
    				  .replaceAll("\"", "&quot;")
		   	   		  .replaceAll("'", "&apos;")
		   	   		  .replaceAll("<", "&lt;")
		   	   		  .replaceAll(">", "&gt;");
    }
    
    /**
     * 将一段文本按行分割成一个数组
     * @param str
     * @return
     */
    public static String[] splitLines(String str) {
    	if (isNull(str)) {
    		return new String[0];
    	} else {
    		return str.split("\r?\n");
    	}
    }
}
