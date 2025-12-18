package com.aishu.wf.core.common.util;



import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.StringTokenizer;

/**
 * @author lw
 */
@SuppressWarnings("unchecked")
public class HttpUtils {

	public HttpUtils() {
	}

	/**
	 * 
	 * Parses a query string passed from the client to the server and builds a
	 * <code>HashTable</code> object with key-value pairs. The query string
	 * should be in the form of a string packaged by the GET or POST method,
	 * that is, it should have key-value pairs in the form <i>key=value</i>,
	 * with each pair separated from the next by a & character.
	 * 
	 * <p>
	 * A key can appear more than once in the query string with different
	 * values. However, the key appears only once in the hashtable, with its
	 * value being an array of strings containing the multiple values sent by
	 * the query string.
	 * 
	 * <p>
	 * When the keys and values are moved into the hashtable, any + characters
	 * are converted to spaces, and characters sent in hexadecimal notation
	 * (like <i>%xx</i>) are converted to ASCII characters.
	 * 
	 * @param s
	 *            a string containing the query to be parsed
	 * 
	 * @return a <code>HashTable</code> object built from the parsed key-value
	 *         pairs
	 * 
	 * @exception IllegalArgumentException
	 *                if the query string is invalid
	 * 
	 */

	static public Hashtable parseQueryString(String s) {
		String valArray[] = null;
		if (s == null) {
			throw new IllegalArgumentException("queryString must not null");
		}
		Hashtable ht = new Hashtable();
		StringBuffer sb = new StringBuffer();
		StringTokenizer st = new StringTokenizer(s, "&");
		while (st.hasMoreTokens()) {
			String pair = (String) st.nextToken();
			if(pair.trim().length() == 0)
				continue;
			int pos = pair.indexOf('=');
			if (pos == -1) {
				throw new IllegalArgumentException("cannot parse queryString:"+s);
			}
			String key = parseName(pair.substring(0, pos), sb);
			String val = parseName(pair.substring(pos + 1, pair.length()), sb);
			if (ht.containsKey(key)) {
				String oldVals[] = (String[]) ht.get(key);
				valArray = new String[oldVals.length + 1];
				for (int i = 0; i < oldVals.length; i++)
					valArray[i] = oldVals[i];
				valArray[oldVals.length] = val;
			} else {
				valArray = new String[1];
				valArray[0] = val;
			}
			ht.put(key, valArray);
		}
		return fixValueArray2SingleStringObject(ht);

	}

	private static Hashtable fixValueArray2SingleStringObject(Hashtable ht) {
		Hashtable result = new Hashtable();
		for(Iterator it = ht.entrySet().iterator();it.hasNext();) {
			Map.Entry entry = (Map.Entry)it.next();
			String[] valueArray = (String[])entry.getValue();
			if(valueArray == null)
				result.put(entry.getKey(), valueArray);
			else
				result.put(entry.getKey(),valueArray.length == 1 ? valueArray[0] : valueArray);
		}
		return result;
	}

	static private String parseName(String s, StringBuffer sb) {
		sb.setLength(0);
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			switch (c) {
			case '+':
				sb.append(' ');
				break;
			case '%':
				try {
					sb.append((char) Integer.parseInt(
							s.substring(i + 1, i + 3), 16));
					i += 2;
				} catch (NumberFormatException e) {
					// need to be more specific about illegal arg
					throw new IllegalArgumentException();
				} catch (StringIndexOutOfBoundsException e) {
					String rest = s.substring(i);
					sb.append(rest);
					if (rest.length() == 2)
						i++;
				}

				break;
			default:
				sb.append(c);
				break;
			}
		}
		return sb.toString();
	}

}
