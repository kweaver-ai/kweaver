import { Input } from 'antd';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import SearchSvg from '../../assets/images/search-icon.svg';
import './search-input.less';
import { debounce } from 'lodash';

interface SearchInputProps {
  className?: string;
  placeholder: string;
  value?: string;
  onSearch: (value: string) => void;
}

interface ISearchInputRef { 
  cleanValue: () => void
}

const SearchInput = forwardRef<ISearchInputRef, SearchInputProps>(({
  className,
  placeholder,
  onSearch,
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
      className="operator-search-input"
      value={searchTitle}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      prefix={<SearchSvg className='search-tool-prefix-icon' />}
      allowClear
    />
  );
});

export default SearchInput;
