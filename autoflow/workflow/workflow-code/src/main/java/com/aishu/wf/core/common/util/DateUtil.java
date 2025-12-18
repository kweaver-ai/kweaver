package com.aishu.wf.core.common.util;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;



public class DateUtil {
	// ~ Static fields/initializers
	// =============================================

	private static String defaultDatePattern = null;
	private static String timePattern = "HH:mm";
	public static final String TS_FORMAT = DateUtil.getDatePattern()
			+ " HH:mm:ss.S";

	// ~ Methods
	// ================================================================

	public DateUtil() {
	}
	

	/**
	 * 获得服务器当前日期及时间，以格式为：yyyy-MM-dd HH:mm:ss的日期字符串形式返回
	 */
	public static String getFormatDateTime() {
		try {
			SimpleDateFormat sdf2 = new SimpleDateFormat(
					"yyyy-MM-dd HH:mm:ss");
			Calendar cale = Calendar.getInstance();
			return sdf2.format(cale.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.getDateTime():" + e.getMessage());
			return "";
		}
	}
	public static String getFormatDateMin() {
		try {
			SimpleDateFormat sdf4 = new SimpleDateFormat(
					"yyyy-MM-dd HH:mm");
			Calendar cale = Calendar.getInstance();
			return sdf4.format(cale.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.getDateTime():" + e.getMessage());
			return "";
		}
	}
	public static String getDateTime() {
		try {
			SimpleDateFormat sdf3 = new SimpleDateFormat(
					"yyyyMMddHHmmss");
			Calendar cale = Calendar.getInstance();
			return sdf3.format(cale.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.getDateTime():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 获得服务器当前日期，以格式为：yyyy-MM-dd的日期字符串形式返回
	 */
	public static String getNowDate() {
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
			Calendar cale = Calendar.getInstance();
			return sdf.format(cale.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.getDate():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 获得服务器当前时间，以格式为：HH:mm:ss的日期字符串形式返回
	 */
	public static String getTime() {
		String temp = " ";
		try {
			SimpleDateFormat sdf1 = new SimpleDateFormat("HH:mm:ss");
			Calendar cale = Calendar.getInstance();
			temp += sdf1.format(cale.getTime());
			return temp;
		} catch (Exception e) {
			System.err.println("DateUtil.getTime():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 统计时开始日期的默认??
	 */
	public static String getStartDate() {
		try {
			return getYear() + "-01-01";
		} catch (Exception e) {
			System.err.println("DateUtil.getStartDate():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 统计时结束日期的默认??
	 */
	public static String getEndDate() {
		try {
			return getNowDate();
		} catch (Exception e) {
			System.err.println("DateUtil.getEndDate():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 获得服务器当前日期的年份
	 */
	public static String getYear() {
		try {
			Calendar cale = Calendar.getInstance();
			return String.valueOf(cale.get(Calendar.YEAR));
		} catch (Exception e) {
			System.err.println("DateUtil.getYear():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 获得服务器当前日期的月份
	 */
	public static String getMonth() {
		try {
			Calendar cale = Calendar.getInstance();
			java.text.DecimalFormat df = new java.text.DecimalFormat();
			df.applyPattern("00;00");
			return df.format((cale.get(Calendar.MONTH) + 1));
		} catch (Exception e) {
			System.err.println("DateUtil.getMonth():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 获得服务器在当前月中天数
	 */
	public static String getDay() {
		try {
			Calendar cale = Calendar.getInstance();
			return String.valueOf(cale.get(Calendar.DAY_OF_MONTH));
		} catch (Exception e) {
			System.err.println("DateUtil.getDay():" + e.getMessage());
			return "";
		}
	}

	/**
	 * 比较两个日期相差的天??
	 * 
	 */
	public static int getMargin(String date1, String date2) {
		int margin;
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
			ParsePosition pos = new ParsePosition(0);
			ParsePosition pos1 = new ParsePosition(0);
			Date dt1 = sdf.parse(date1, pos);
			Date dt2 = sdf.parse(date2, pos1);
			long l = dt1.getTime() - dt2.getTime();
			margin = (int) (l / (24 * 60 * 60 * 1000));
			return margin;
		} catch (Exception e) {
			System.err.println("DateUtil.getMargin():" + e.toString());
			return 0;
		}
	}

	/**
	 * 比较两个日期相差的天??
	 */
	public static double getDoubleMargin(String date1, String date2) {
		double margin;
		try {
			SimpleDateFormat sdf2 = new SimpleDateFormat(
					"yyyy-MM-dd HH:mm:ss");
			ParsePosition pos = new ParsePosition(0);
			ParsePosition pos1 = new ParsePosition(0);
			Date dt1 = sdf2.parse(date1, pos);
			Date dt2 = sdf2.parse(date2, pos1);
			long l = dt1.getTime() - dt2.getTime();
			margin = (l / (24 * 60 * 60 * 1000.00));
			return margin;
		} catch (Exception e) {
			System.err.println("DateUtil.getMargin():" + e.toString());
			return 0;
		}
	}

	/**
	 * 比较两个日期相差的月??
	 */
	public static int getMonthMargin(String date1, String date2) {
		int margin;
		try {
			margin = (Integer.parseInt(date2.substring(0, 4)) - Integer
					.parseInt(date1.substring(0, 4))) * 12;
			margin += (Integer.parseInt(date2.substring(4, 7).replaceAll("-0",
					"-")) - Integer.parseInt(date1.substring(4, 7).replaceAll(
					"-0", "-")));
			return margin;
		} catch (Exception e) {
			System.err.println("DateUtil.getMargin():" + e.toString());
			return 0;
		}
	}

	/**
	 * 返回日期加X天后的日??
	 */
	public static String addDay(String date, int i) {
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
			GregorianCalendar gCal = new GregorianCalendar(Integer
					.parseInt(date.substring(0, 4)), Integer.parseInt(date
					.substring(5, 7)) - 1, Integer.parseInt(date.substring(8,
					10)));
			gCal.add(GregorianCalendar.DATE, i);
			return sdf.format(gCal.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.addDay():" + e.toString());
			return getNowDate();
		}
	}

	/**
	 * 返回日期加X月后的日??
	 */
	public static String addMonth(String date, int i) {
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
			GregorianCalendar gCal = new GregorianCalendar(Integer
					.parseInt(date.substring(0, 4)), Integer.parseInt(date
					.substring(5, 7)) - 1, Integer.parseInt(date.substring(8,
					10)));
			gCal.add(GregorianCalendar.MONTH, i);
			return sdf.format(gCal.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.addMonth():" + e.toString());
			return getNowDate();
		}
	}

	/**
	 * 返回日期加X年后的日??
	 */
	public static String addYear(String date, int i) {
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
			GregorianCalendar gCal = new GregorianCalendar(Integer
					.parseInt(date.substring(0, 4)), Integer.parseInt(date
					.substring(5, 7)) - 1, Integer.parseInt(date.substring(8,
					10)));
			gCal.add(GregorianCalendar.YEAR, i);
			return sdf.format(gCal.getTime());
		} catch (Exception e) {
			System.err.println("DateUtil.addYear():" + e.toString());
			return "";
		}
	}

	/**
	 * 返回某年某月中的??大天
	 */
	public static int getMaxDay(String year, String month) {
		int day = 0;
		try {
			int iyear = Integer.parseInt(year);
			int imonth = Integer.parseInt(month);
			if (imonth == 1 || imonth == 3 || imonth == 5 || imonth == 7
					|| imonth == 8 || imonth == 10 || imonth == 12) {
				day = 31;
			} else if (imonth == 4 || imonth == 6 || imonth == 9
					|| imonth == 11) {
				day = 30;
			} else if ((0 == (iyear % 4)) && (0 != (iyear % 100))
					|| (0 == (iyear % 400))) {
				day = 29;
			} else {
				day = 28;
			}
			return day;
		} catch (Exception e) {
			System.err.println("DateUtil.getMonthDay():" + e.toString());
			return 1;
		}
	}

	/**
	 * 格式化日??
	 */
	@SuppressWarnings("static-access")
	public String rollDate(String orgDate, int Type, int Span) {
		try {
			String temp = "";
			int iyear, imonth, iday;
			int iPos = 0;
			char seperater = '-';
			if (orgDate == null || orgDate.length() < 6) {
				return "";
			}

			iPos = orgDate.indexOf(seperater);
			if (iPos > 0) {
				iyear = Integer.parseInt(orgDate.substring(0, iPos));
				temp = orgDate.substring(iPos + 1);
			} else {
				iyear = Integer.parseInt(orgDate.substring(0, 4));
				temp = orgDate.substring(4);
			}

			iPos = temp.indexOf(seperater);
			if (iPos > 0) {
				imonth = Integer.parseInt(temp.substring(0, iPos));
				temp = temp.substring(iPos + 1);
			} else {
				imonth = Integer.parseInt(temp.substring(0, 2));
				temp = temp.substring(2);
			}

			imonth--;
			if (imonth < 0 || imonth > 11) {
				imonth = 0;
			}

			iday = Integer.parseInt(temp);
			if (iday < 1 || iday > 31) {
				iday = 1;
			}

			Calendar orgcale = Calendar.getInstance();
			orgcale.set(iyear, imonth, iday);
			temp = this.rollDate(orgcale, Type, Span);
			return temp;
		} catch (Exception e) {
			return "";
		}
	}

	public static String rollDate(Calendar cal, int Type, int Span) {
		try {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
			String temp = "";
			Calendar rolcale;
			rolcale = cal;
			rolcale.add(Type, Span);
			temp = sdf.format(rolcale.getTime());
			return temp;
		} catch (Exception e) {
			return "";
		}
	}

	/**
	 * 
	 * 返回默认的日期格??
	 * 
	 */
	public static synchronized String getDatePattern() {
		defaultDatePattern = "yyyy-MM-dd";
		return defaultDatePattern;
	}

	/**
	 * 将指定日期按默认格式进行格式代化成字符串后输出如：yyyy-MM-dd
	 */
	public static final String getDate(Date aDate) {
		SimpleDateFormat df = null;
		String returnValue = "";

		if (aDate != null) {
			df = new SimpleDateFormat(getDatePattern());
			returnValue = df.format(aDate);
		}

		return (returnValue);
	}

	/**
	 * 取得给定日期的时间字符串，格式为当前默认时间格式
	 */
	public static String getTimeNow(Date theTime) {
		return convertDateToString(timePattern, theTime);
	}

	/**
	 * 取得当前时间的Calendar日历对象
	 */
	public Calendar getToday() throws ParseException {
		Date today = new Date();
		SimpleDateFormat df = new SimpleDateFormat(getDatePattern());
		String todayAsString = df.format(today);
		Calendar cal = new GregorianCalendar();
		cal.setTime(convertStringToDate(todayAsString));
		return cal;
	}

	/**
	 * 将日期类转换成指定格式的字符串形??
	 */
	public static final String convertDateToString(String aMask, Date aDate) {
		SimpleDateFormat df = null;
		String returnValue = "";

		if (aDate != null) {		
			df = new SimpleDateFormat(aMask);
			returnValue = df.format(aDate);
		}
		return (returnValue);
	}

	/**
	 * 将指定的日期转换成默认格式的字符串形??
	 */
	public static final String convertDateToString(Date aDate) {
		return convertDateToString(getDatePattern(), aDate);
	}

	/**
	 * 将日期字符串按指定格式转换成日期类型
	 * 
	 * @param aMask
	 *            指定的日期格式，??:yyyy-MM-dd
	 * @param strDate
	 *            待转换的日期字符??
	 */

	public static final Date convertStringToDate(String aMask, String strDate)
			throws ParseException {
		SimpleDateFormat df = null;
		Date date = null;
		df = new SimpleDateFormat(aMask);

		
			System.err.println("converting '" + strDate + "' to date with mask '"
					+ aMask + "'");
		
		try {
			date = df.parse(strDate);
		} catch (ParseException pe) {
			//System.err.println("ParseException: " + pe);
			throw pe;
		}
		return (date);
	}

	/**
	 * 将日期字符串按默认格式转换成日期类型
	 */
	public static Date convertStringToDate(String strDate)
			throws ParseException {
		Date aDate = null;

		try {
			aDate = convertStringToDate(getDatePattern(), strDate);
		} catch (ParseException pe) {
		}

		return aDate;
	}

	/**
	 * 返回??个JAVA??单类型的日期字符??
	 */
	public static String getSimpleDateFormat() {
		SimpleDateFormat formatter = new SimpleDateFormat();
		String NDateTime = formatter.format(new Date());
		return NDateTime;
	}

	/**
	 * 将两个字符串格式的日期进行比??
	 * 
	 * @param last
	 *            要比较的第一个日期字符串
	 * @param now
	 *            要比较的第二个日期格式字符串
	 * @return true(last 在now 日期之前),false(last 在now 日期之后)
	 */
	public static boolean compareTo(String last, String now) {
		try {
			SimpleDateFormat formatter = new SimpleDateFormat(
					"yyyy-MM-dd HH:mm:ss");
			Date temp1 = formatter.parse(last);
			Date temp2 = formatter.parse(now);
			if (temp1.after(temp2)) {
				return false;
			} else if (temp1.before(temp2)) {
				return true;
			}
		} catch (ParseException e) {
			System.err.println(e.getMessage());
		}
		return false;
	}

	protected Object convertToDate(Class type, Object value) {
		DateFormat df = new SimpleDateFormat(TS_FORMAT);
		if (value instanceof String) {
			try {
				if (StringUtils.isEmpty(value.toString())) {
					return null;
				}
				return df.parse((String) value);
			} catch (Exception pe) {
				System.err.println(
						"Error converting String to Timestamp");
			}
		}

		System.err.println("Could not convert "
				+ value.getClass().getName() + " to " + type.getName());
		return df;
	}

	/**
	 * 为查询日期添加最小时??
	 * 
	 * @return
	 */
	@SuppressWarnings("deprecation")
	public static Date addStartTime(Date param) {
		Date date = param;
		try {
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			return date;
		} catch (Exception ex) {
			return date;
		}
	}

	/**
	 * 为查询日期添加最大时??
	 * 
	 * @return
	 */
	@SuppressWarnings("deprecation")
	public static Date addEndTime(Date param) {
		Date date = param;
		try {
			date.setHours(23);
			date.setMinutes(59);
			date.setSeconds(0);
			return date;
		} catch (Exception ex) {
			return date;
		}
	}

	/**
	 * 返回系统现在年份中指定月份的天数
	 * 
	 * @return 指定月的总天??
	 */
	@SuppressWarnings("deprecation")
	public static String getMonthLastDay(int month) {
		Date date = new Date();
		int[][] day = {{0, 30, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31},
				{0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}};
		int year = date.getYear() + 1900;
		if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) {
			return day[1][month] + "";
		} else {
			return day[0][month] + "";
		}
	}

	/**
	 * 返回指定年份中指定月份的天数
	 * 
	 * @return 指定月的总天??
	 */
	public static String getMonthLastDay(int year, int month) {
		int[][] day = {{0, 30, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31},
				{0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}};
		if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) {
			return day[1][month] + "";
		} else {
			return day[0][month] + "";
		}
	}

	/**
	 * 取得当前时间的日??
	 * 
	 * @return
	 */
	@SuppressWarnings("deprecation")
	public static String getTimestamp() {
		Date date = new Date();
		String timestamp = "" + (date.getYear() + 1900) + date.getMonth()
				+ date.getDate() + date.getMinutes() + date.getSeconds()
				+ date.getTime();
		return timestamp;
	}
	/**
	 * 取得指定时间的日??
	 * 
	 * @return
	 */
	@SuppressWarnings("deprecation")
	public static String getTimestamp(Date date) {
		String timestamp = "" + (date.getYear() + 1900) + date.getMonth()
				+ date.getDate() + date.getMinutes() + date.getSeconds()
				+ date.getTime();
		return timestamp;
	}
	
	 /**
     * 计算时间day
     * @return day
     */
	@SuppressWarnings("deprecation")
	public static String differByDay(String startDate, String endDate) {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
		Date date1 = null;
		Date date2 = null;
		try {
			date1 = sdf.parse(startDate);
			date2 = sdf.parse(endDate);
		} catch (ParseException e) {
			return "";
		}
		return "" + (date2.getTime() / 86400000 - date1.getTime() / 86400000);
	}

	 public static String formatTime(long time)
	    {
	        time = time/ 1000;
	        String strHour = "" + (time/3600);
	        String strMinute = "" + time%3600/60;
	        String strSecond = "" + time%3600%60;
	         
	        strHour = strHour.length() < 2? "0" + strHour: strHour;
	        strMinute = strMinute.length() < 2? "0" + strMinute: strMinute;
	        strSecond = strSecond.length() < 2? "0" + strSecond: strSecond;
	         
	        String strRsult = "";
	         
	        if (!strHour.equals("00"))
	        {
	            strRsult += strHour + ":";
	        }
	         
	        if (!strMinute.equals("00"))
	        {
	            strRsult += strMinute + ":";
	        }
	         
	        strRsult += strSecond;
	         
	        return strRsult;
	    }
}
