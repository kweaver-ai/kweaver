import { type InputProps as AntdInputProps } from 'antd';
import IconFont from '../../IconFont';
import Spell from '../Spell';

/** 预设输入框-搜索 */
const Search: React.FC<AntdInputProps> = (props) => {
  return <Spell suffix={<IconFont type="icon-search" style={{ color: '#d9d9d9' }} />} {...props} />;
};

export default Search;
