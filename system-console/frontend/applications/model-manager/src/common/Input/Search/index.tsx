import intl from 'react-intl-universal';
import type { InputProps as AntdInputProps } from 'antd';

import Spell from '../Spell';
import IconFont from '../../IconFont';

/** 预设输入框-搜索 */
const Search: React.FC<AntdInputProps> = props => {
  return <Spell suffix={<IconFont type='icon-dip-search' style={{ color: '#d9d9d9' }} />} placeholder={intl.get('components.input.search')} {...props} />;
};

export default Search;
