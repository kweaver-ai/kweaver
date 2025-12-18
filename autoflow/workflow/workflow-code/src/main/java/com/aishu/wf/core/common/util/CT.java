package com.aishu.wf.core.common.util;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NoSuchElementException;
import java.util.Set;



/**
 * Collection tool
 *    
 * 集合操作类，不依赖任何第三方类库</br>  
 *   
 * Creator: eddie</br>
 * Mender:  eddie</br>
 *   
 * @version 1.0.0  
 *
 */
public class CT {
    private static final Class<?> collection = Collection.class;
    private static final Class<?> iterator = Iterator.class;
	private static final Class<?> map = Map.class;
	
	private CT(){}
	
	public static void main(String[] args) throws Exception {
	}
	
	/**
	 * 将一个map的值映射到一个对象之中
	 * reflectMap2Bean  
	 * @param map
	 * @param bean
	 * @throws SecurityException
	 * @throws NoSuchFieldException
	 * @throws IllegalArgumentException
	 * @throws IllegalAccessException    
	 * void   
	 * @exception    
	 * @since  1.0.0
	 */
	public final static void reflectMap2Bean(Map<String,Object> map,Object bean) throws SecurityException, NoSuchFieldException, IllegalArgumentException, IllegalAccessException {
		if (!CT.isEmpty(map)){
			Map.Entry<String, Object> item = null;
			Class<?> cls = bean.getClass();
			Field field = null;

			for (Iterator<Map.Entry<String, Object>> it = CT.getIterator(map); it.hasNext();) {
				item = it.next();
				field = cls.getDeclaredField(item.getKey());
				if (field != null)
				{
					field.setAccessible(true);
					field.set(bean, field.getType().cast(item.getValue()));
				}
			}
		}
	}
	
	/**
     * 将集合内容连接成一个字符串
     * concat  
     * @param o,集合对象
     * @param concatStr,连接分隔符
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
	public final static String concat(Object o,String concatStr) {
    	if (isCollection(o)) {
    		StringBuilder str = new StringBuilder();
    		String tmp = null;
    		
    		for (Iterator<?> it = getIterator(o); it.hasNext();) {
    			tmp = it.next().toString();
    			if (!ST.isNull(tmp)) {
    				str.append(tmp).append(concatStr);
    			}
    		}
    		String result = str.toString();
    		return ST.isNull(result) ? result :  result.substring(0, result.length() - 1);
    	} else {
    		return "";
    	}
    }
    
    /**
     * 将集合内容连接成一个字符串,使用默认分隔符-","
     * concat  
     * @param o
     * @return    
     * String   
     * @exception    
     * @since  1.0.0
     */
    public final static String concat(Object o) {
    	return concat(o,",");
    }
    
    /**
     * 判断集合类型或数组的对象是否为空或长度小于1</br>
     * 支持接口类型
     * Collection 
     * Iterator
     * Map
     * Array
     * @param obj
     * @return boolean
     */
    public final static boolean isEmpty(Object obj)
    {
    	if (obj == null)
    		return true;
    	if (iterator.isInstance(obj))
    	{
    		return !((Iterator<?>)obj).hasNext();
    	} else {
    		return getSize(obj) <= 0;
    	}
    }
    
    /**
     * 判断集合类型或数组的对象是否不为空或长度大于0</br>
     * 支持接口类型
     * Collection 
     * Iterator
     * Map
     * Array
     * @param obj
     * @return boolean
     */
    public final static boolean isNotEmpty(Object obj) {
    	return !isEmpty(obj);
    }
    
    /**
     * 获取集合大小
     * getCollectionSize  
     * @param obj
     * @return    
     * int   
     * @exception    
     * @since  1.0.0
     */
    public final static int getSize(Object obj) {
    	
    	if (isCollection(obj)) {
    		if (collection.isInstance(obj))
        	{
        		return ((Collection<?>)obj).size();
        	}
        	else if (iterator.isInstance(obj))
        	{
        		int i = 0;
        		for (Iterator<?> it = (Iterator<?>)obj;it.hasNext();) {
        			i++;
        			it.next();
        		}
        		return i;
        	}
        	else if (map.isInstance(obj))
        	{
        		return ((Map<?, ?>)obj).size();
        	}
        	else if (obj.getClass().isArray())
        	{
        		return (Array.getLength(obj));
        	}
    	} 
    	return 0;
    }
    
    /**
     * 判断对象是否为集合类型
     * isCollections  
     * @param col
     * @return    
     * boolean   
     * @exception    
     * @since  1.0.0
     */
    public final static boolean isCollection(Object col) {
    	return col == null ? false : (collection.isInstance(col) || iterator.isInstance(col) || map.isInstance(col) || col.getClass().isArray());
    }
    
    /**
     * 将集合对象以迭代器的方式返回
     * @param obj
     * @return
     * @throws UnsupportedOperationException
     */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public final static Iterator<Entry<String, Object>> getIterator(Object obj) throws UnsupportedOperationException{
    	if (collection.isInstance(obj))
    	{
    		return (((Collection)obj).iterator());
    	}
    	else if (iterator.isInstance(obj))
    	{
    		return (Iterator)obj;
    	}
    	else if (map.isInstance(obj))
    	{
    		return (((Map)obj).entrySet().iterator());
    	} else if (obj != null && obj.getClass().isArray()) {
    		return new _Iterator((Object[])obj);
    	} else {
    		return new _Iterator(null);
    	}
    }
    
    /**
     * 为数组类型对象包装一个迭代器
     * @author SunYue
     *
     */
    @SuppressWarnings("rawtypes")
	private final static class _Iterator implements Iterator {
    	private Object[] array = null;
    	private int index = 0;
    	private int size = 0;
    	
    	public  _Iterator(Object[] array) {
    		this.array = array;
    		this.size = array == null ? 0 : array.length;
    	}
    	
		public boolean hasNext() {
			return index < size;
		}

		public Object next() throws NoSuchElementException{
    		if(!hasNext()){
				throw new NoSuchElementException();
			}
			return array[index++];
		}

		public void remove() {
			throw new UnsupportedOperationException();
		}
    }
    
    /**
     * 将字符串转换为对应的类型值
     * @param args,要转换类型的字符串数组
     * @param types,类型数组,数组长度应与字符串数组长度一致
     * @return
     * @throws NullPointerException
     * @throws IndexOutOfBoundsException
     */
	@SuppressWarnings("rawtypes")
	public final static Object[] convertParameters(String[] args,Class[] types) throws NullPointerException,IndexOutOfBoundsException{
    	if (isEmpty(args) || isEmpty(types))
    		return new Object[0];
    	Object[] values = new Object[args.length];
    	for (int i = 0; i < args.length; i++) {
    		values[i] = types[i].cast(args[i]);
    	}
    	return values;
    }
    
	/**
	 * 在键-值对集合中根据值获取key
	 * @param value
	 * @return
	 */
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public final static List getKeys(Map map,Object value) {
		if (isEmpty(map))
			return new ArrayList(0);
		List keys = new ArrayList(0);
		Set set =  map.entrySet();
		for (Iterator it = set.iterator(); it.hasNext();) {
			Map.Entry entry = (Map.Entry)it.next();
			Object v = entry.getValue();
			if (ST.equals(value,v))
				keys.add(entry.getKey());
		}
		return keys;
	}
}
