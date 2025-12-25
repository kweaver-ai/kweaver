import org.springframework.dao.DataAccessException;

import java.lang.reflect.Array;
import java.util.Collection;
import java.util.Map;


/**
 * Ognl工具类，主要是为了在ognl表达式访问静态方法时可以减少长长的类名称编写
 * Ognl访问静态方法的表达式为: @class@method(args)
 * 
 * 示例使用: 
 * <pre>
 * 	&lt;if test="@Ognl@isNotEmpty(userId)">
 *		and user_id = #{userId}
 *	&lt;/if>
 * </pre>
 * @author badqiu
 *
 */
public class Ognl {
	
	/**
	 * 可以用于判断String,Map,Collection,Array是否为空
	 * @param o
	 * @return
	 */
	public static boolean isEmpty(Object o) throws IllegalArgumentException {
		if(o == null) return true;

		if(o instanceof String) {
			if(((String)o).length() == 0){
				return true;
			}
		} else if(o instanceof Collection) {
			if(((Collection)o).isEmpty()){
				return true;
			}
		} else if(o.getClass().isArray()) {
			if(Array.getLength(o) == 0){
				return true;
			}
		} else if(o instanceof Map) {
			if(((Map)o).isEmpty()){
				return true;
			}
		}else {
			return false;
//			throw new IllegalArgumentException("Illegal argument type,must be : Map,Collection,Array,String. but was:"+o.getClass());
		}

		return false;
	}
	
	/**
	 * 可以用于判断 Map,Collection,String,Array是否不为空
	 * @param c
	 * @return
	 */	
	public static boolean isNotEmpty(Object o) {
		return !isEmpty(o);
	}
	
	public static boolean isNotBlank(Object o) {
		return !isBlank(o);
	}
	
	public static boolean isNumber(Object o) {
		if(o == null) return false;
		if(o instanceof Number) {
			return true;
		}
		if(o instanceof String) {
			String str = (String)o;
			if(str.length() == 0) return false;
			if(str.trim().length() == 0) return false;
			
			try {
				Double.parseDouble(str);
				return true;
			}catch(NumberFormatException e) {
				return false;
			}
		}
		return false;
	}
	
	public static boolean isBlank(Object o) {
		if(o == null)
			return true;
		if(o instanceof String) {
			String str = (String)o;
			return isBlank(str);
		}
		return false;
	}

	public static boolean isBlank(String str) {
		if(str == null || str.length() == 0) {
			return true;
		}
		
		for (int i = 0; i < str.length(); i++) {
			if (!Character.isWhitespace(str.charAt(i))) {
				return false;
			}
		}
		return true;
	}
	/**
	 * 用于验证那些列可以排序
	 * 
	 * ibatis示列使用
	 * &lt;if test="@Ognl@checkOrderBy(orderBy,'username,password')">
	 *		ORDER BY ${orderBy}
	 * &lt;/if>
	 * 
	 * <pre>
	 * 返回示例: 
	 * 返回false相关验证:
	 * checkOrderBy(null,"user,pwd") 
	 * checkOrderBy(" ","user,pwd") 
	 * checkOrderBy("user asc,pwd desc","user") pwd不能排序
	 * 
	 * 返回true相关验证:
	 * checkOrderBy("user asc,pwd desc",null) 
	 * checkOrderBy("user asc,pwd desc","") 
	 * checkOrderBy("user asc,pwd desc","user,pwd") 
	 * </pre>
	 * @param orderBy 需要验证的order by字符串
	 * @param validSortColumns 可以排序的列
	 * @throws DataAccessException
	 */
	/*public static boolean checkOrderBy(String orderby,String validSortColumns) throws DataAccessException{
		if(isBlank(orderby)) return false;
		if(orderby.indexOf("'") >= 0 || orderby.indexOf("\\") >= 0) {
			throw new IllegalArgumentException("orderBy:"+orderby+" has SQL Injection risk");
		}
		if(orderby != null && orderby.length() > 50) {
			throw new IllegalArgumentException("orderby.length() <= 50 must be true");
		}
		if(validSortColumns == null) return true;
		List<SortInfo> infos = SortInfo.parseSortColumns(orderby);
		String[] passColumns = validSortColumns.split(",");
		for(SortInfo info : infos) {
			String columnName = info.getColumnName();
			if(!isPass(passColumns, info, columnName)) {
				throw new InvalidDataAccessApiUsageException("orderby:["+orderby+"] is invalid, only can orderby:"+validSortColumns);
			}
		}
		return true;
	}

	private static boolean isPass(String[] passColumns, SortInfo info, String columnName) {
		for(String column : passColumns) {
			if(column.equalsIgnoreCase(info.getColumnName())) {
				return true;
			}
		}
		return false;
	}*/

}
