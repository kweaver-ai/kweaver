import { Input } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import searchSvg from '../../assets/search-icon.svg';
import styles from './search-input.module.less';
import { debounce } from 'lodash';

interface SearchInputProps {
  className?: string;
  placeholder: string;
  value?: string;
  onSearch: (value: string) => void;
  style?: any
}

interface ISearchInputRef { 
  cleanValue: () => void
}

const SearchInput = forwardRef<ISearchInputRef, SearchInputProps>(({
  className,
  placeholder,
  onSearch,
  style,
}: SearchInputProps, ref) => {
  const [searchTitle, setSearchTitle] = useState<string>('');
  const isComposing = useRef(false);

  useImperativeHandle(ref, () => {
    return {
      cleanValue: () => {
        setSearchTitle('')
      },
      setValue: (newValue: string) => handleSearch(newValue),
    };
  });

  const debouncedFetchSearch = debounce((
    title: string
  ) => {
    onSearch(title);
  }, 300);

  const handleSearch = (value: string) => {
    setSearchTitle(value);
    if (!isComposing.current) { 
      debouncedFetchSearch(value);
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposing.current = false;
    const value = e.currentTarget.value;
    handleSearch(value);
  };

  return (
    <Input
      placeholder={placeholder || ''}
      onChange={(e) => handleSearch(e.target.value)}
      className={`${className} ${styles['search-input']}`}
      value={searchTitle}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      prefix={<img src={searchSvg} alt='' className={styles['search-tool-prefix-icon']} />}
      style={ {width: 200, marginLeft: 16,...style }}
      allowClear
    />
  );
});

export default SearchInput;
