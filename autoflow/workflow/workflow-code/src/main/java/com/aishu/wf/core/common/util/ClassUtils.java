package com.aishu.wf.core.common.util;

import java.beans.Introspector;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.util.Assert;

/**
 * @author lw
 * 
 */
public abstract class ClassUtils {
	private static final Log logger = LogFactory.getLog(ClassUtils.class);

	public static final String ARRAY_SUFFIX = "[]";

	private static final char PACKAGE_SEPARATOR = '.';

	private static final char INNER_CLASS_SEPARATOR = '$';

	public static final String CGLIB_CLASS_SEPARATOR = "$$";

	public static final String CLASS_FILE_SUFFIX = ".class";

	private static final Map primitiveWrapperTypeMap = new HashMap(8);

	private static final Map primitiveTypeNameMap = new HashMap(8);

	/**
	 * 静态块主要是用来缓存基础类型的包装器类和基础类型
	 * primitiveWrapperTypeMap以基础类型的包装器类的Class做为key,基础类型的Class做为Value
	 * primitiveTypeNameMap以基础类型的Class的name做为key,基础类型的Class做为Value
	 */
	static {
		primitiveWrapperTypeMap.put(Boolean.class, boolean.class);
		primitiveWrapperTypeMap.put(Byte.class, byte.class);
		primitiveWrapperTypeMap.put(Character.class, char.class);
		primitiveWrapperTypeMap.put(Double.class, double.class);
		primitiveWrapperTypeMap.put(Float.class, float.class);
		primitiveWrapperTypeMap.put(Integer.class, int.class);
		primitiveWrapperTypeMap.put(Long.class, long.class);
		primitiveWrapperTypeMap.put(Short.class, short.class);
		for (Iterator it = primitiveWrapperTypeMap.values().iterator(); it
				.hasNext();) {
			Class primitiveClass = (Class) it.next();
			primitiveTypeNameMap.put(primitiveClass.getName(), primitiveClass);
		}

	}
	/**
	 * 优先以当前线程上的类加载器做为返回值,如果没有就以当前类ClassUtils的类加载器返回值。
	 * 
	 */
	public static ClassLoader getDefaultClassLoader() {

		ClassLoader cl = null;
		try {
			cl = Thread.currentThread().getContextClassLoader();
		} catch (Throwable ex) {
			logger
					.debug(
							"Cannot access thread context ClassLoader-falling back to system class loader",
							ex);

		}
		if (cl == null) {
			cl = ClassUtils.class.getClassLoader();
		}
		return cl;

	}

	public static boolean isPresent(String className) {
		return isPresent(className, getDefaultClassLoader());
	}
	/**
	 * 通过调用内部的forName(className, classLoader);来查看是否有父类
	 * 
	 */
	public static boolean isPresent(String className, ClassLoader classLoader) {
		try {
			forName(className, classLoader);
			return true;
		} catch (Throwable ex) {
			if (logger.isDebugEnabled()) {
				logger.debug("Class [" + className
						+ "] or one of its dependencies is not present:" + ex);
			}
			return false;
		}
	}
	
	public static Class findClass(String name) throws ClassNotFoundException {
		return findClass(name, null);
	}
	/**
	 * 首先检验name是否包含[],有查看基础类型名的缓存器中是否有该name想对应的基础类型Class对象,
	 * 有就实例化该数组.
	 * 没有就以默认的方式再参数loader的基础上加载该类,
	 * 如果参数loader为null,就调用Class.forName(name, true, getDefaultClassLoader())
	 * 做为返回。
	 * 
	 */
	public static Class findClass(String name, ClassLoader loader)
			throws ClassNotFoundException {
		if (StringUtils.isNotNull(name)) {
			return null;
		}
		Class type = null;
		int dim = 0;
		while (name.endsWith("[]")) {
			dim++;
			name = name.substring(0, name.length() - 2);
		}
		type = (Class) primitiveTypeNameMap.get(name);
		if (type == null) {
			if (loader != null) {
				type = loader.loadClass(name);
			} else {
				type = Class.forName(name, true, getDefaultClassLoader());
			}
		}
		if (dim == 0) {
			return type;
		} else {
			return Array.newInstance(type, new int[dim]).getClass();
		}
	}
	/**
	 * 根据参数name在primitiveTypeNameMap.keySet().toArray()中
	 * 以数组的二分查找算法找出相对应的基础类型的Class对象
	 * 
	 */
	private static Class findPrimitiveClass(String name) {
		Class[] primitiveTypeNames = (Class[]) primitiveTypeNameMap.keySet().toArray(new Class[0]);
		int i = Arrays.binarySearch(primitiveTypeNames, name);
		if (i >= 0) {
			return primitiveTypeNames[i];
		}
		return null;
	}

	public static Class forName(String name) throws ClassNotFoundException {
		return forName(name, getDefaultClassLoader());
	}

	public static Class forName(String name, ClassLoader classLoader)
			throws ClassNotFoundException {
		Assert.notNull(name, "Name must not be null");
		Class clazz = resolvePrimitiveClassName(name);
		if (clazz != null) {
			return clazz;
		}
		if (name.endsWith(ARRAY_SUFFIX)) {
			String elementClassName = name.substring(0, name.length()
					- ARRAY_SUFFIX.length());
			Class elementClass = forName(elementClassName, classLoader);
			return Array.newInstance(elementClass, 0).getClass();
		}
		ClassLoader classLoaderToUse = classLoader;
		if (classLoaderToUse == null) {
			classLoaderToUse = getDefaultClassLoader();
		}
		return classLoaderToUse.loadClass(name);
	}

	public static Class resolveClassName(String className,
			ClassLoader classLoader) {
		try {
			return forName(className, classLoader);
		} catch (ClassNotFoundException ex) {
			throw new IllegalArgumentException("Cannot find class ["
					+ className + "]. Root cause: " + ex);
		}
	}

	public static Class resolvePrimitiveClassName(String name) {
		Class result = null;
		if (name != null && name.length() <= 8) {
			result = (Class) primitiveTypeNameMap.get(name);
		}
		return result;
	}

	public static Class getUserClass(Object instance) {
		Assert.notNull(instance, "Instance must not be null");
		return getUserClass(instance.getClass());
	}

	public static Class getUserClass(Class clazz) {
		return (clazz != null
				&& clazz.getName().indexOf(CGLIB_CLASS_SEPARATOR) != -1 ? clazz
				.getSuperclass() : clazz);
	}

	public static String getShortName(String className) {
		Assert.hasLength(className, "Class name must not be empty");
		int lastDotIndex = className.lastIndexOf(PACKAGE_SEPARATOR);
		int nameEndIndex = className.indexOf(CGLIB_CLASS_SEPARATOR);
		if (nameEndIndex == -1) {
			nameEndIndex = className.length();
		}
		String shortName = className.substring(lastDotIndex + 1, nameEndIndex);
		shortName = shortName.replace(INNER_CLASS_SEPARATOR, PACKAGE_SEPARATOR);
		return shortName;
	}

	public static String getShortName(Class clazz) {
		return getShortName(getQualifiedName(clazz));
	}

	public static String getShortNameAsProperty(Class clazz) {
		return Introspector.decapitalize(getShortName(clazz));
	}

	public static String getClassFileName(Class clazz) {
		Assert.notNull(clazz, "Class must not be null");
		String className = clazz.getName();
		int lastDotIndex = className.lastIndexOf(PACKAGE_SEPARATOR);
		return className.substring(lastDotIndex + 1) + CLASS_FILE_SUFFIX;
	}

	public static String getQualifiedName(Class clazz) {
		Assert.notNull(clazz, "Class must not be null");
		if (clazz.isArray()) {
			return getQualifiedNameForArray(clazz);
		} else {
			return clazz.getName();
		}
	}

	private static String getQualifiedNameForArray(Class clazz) {
		StringBuffer buffer = new StringBuffer();
		while (clazz.isArray()) {
			clazz = clazz.getComponentType();
			buffer.append(ClassUtils.ARRAY_SUFFIX);
		}
		buffer.insert(0, clazz.getName());
		return buffer.toString();
	}

	public static String getQualifiedMethodName(Method method) {
		Assert.notNull(method, "Method must not be null");
		return method.getDeclaringClass().getName() + "." + method.getName();
	}
	
	public static Object getInstance(String classStr)throws Exception{
		Object obj= null;
		try {
			Class clazz = Class.forName(classStr);
			obj=BeanUtils.instantiate(clazz);
		} catch (Exception e) {
			throw new Exception(e);
		}
		return obj;
	}
}
