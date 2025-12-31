// 整数型
const DataType_Integer = 'integer';
const DataType_UnsignedInteger = 'unsigned integer';

// 浮点型
const DataType_Float = 'float';

// 任意精度数
const DataType_Decimal = 'decimal';

// 字符串型
const DataType_String = 'string';
const DataType_Text = 'text';

// 时间型
const DataType_Date = 'date';
const DataType_Time = 'time';
const DataType_Datetime = 'datetime';
const DataType_Timestamp = 'timestamp';

// ip类型
const DataType_Ip = 'ip';

// 布尔型
const DataType_Boolean = 'boolean';

// 二进制数据类型
const DataType_Binary = 'binary';

// json类型
const DataType_Json = 'json';

// 空间类型
const DataType_Point = 'point';
const DataType_Shape = 'shape';

// 向量类型
const DataType_Vector = 'vector';

const DataType_All = [
  { name: DataType_Integer, type: 'number' },
  { name: DataType_UnsignedInteger, type: 'number' },
  { name: DataType_Float, type: 'number' },
  { name: DataType_Decimal, type: 'number' },
  { name: DataType_String, type: 'string' },
  { name: DataType_Text, type: 'string' },
  { name: DataType_Date, type: 'date' },
  { name: DataType_Time, type: 'date' },
  { name: DataType_Datetime, type: 'date' },
  { name: DataType_Timestamp, type: 'date' },
  { name: DataType_Ip, type: 'string' },
  { name: DataType_Boolean, type: 'boolean' },
  { name: DataType_Binary, type: 'string' },
  { name: DataType_Json, type: 'string' },
  { name: DataType_Point, type: 'string' },
  { name: DataType_Shape, type: 'string' },
  { name: DataType_Vector, type: 'string' },
];

const DataType_Date_Types = DataType_All.filter((item) => item.type === 'date').map((item) => item.name);
const DataType_Number_Types = DataType_All.filter((item) => item.type === 'number').map((item) => item.name);
const DataType_Boolean_Types = DataType_All.filter((item) => item.type === 'boolean').map((item) => item.name);

const DataType_All_Name = DataType_All.map((item) => item.name);

export default {
  DataType_All,
  DataType_Date_Types,
  DataType_Number_Types,
  DataType_Boolean_Types,
  DataType_All_Name,
};
