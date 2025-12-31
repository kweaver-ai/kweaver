export interface TFrameworkProps {
  lang: 'zh-cn';
  [key: string]: any;
}

const initFrameworkProps: TFrameworkProps = {
  lang: 'zh-cn',
};

class FrameworkProps {
  private _data: TFrameworkProps;

  public constructor(data: TFrameworkProps) {
    this._data = data;
  }

  // Getter 方法
  public get data(): TFrameworkProps {
    return this._data;
  }

  // Setter 方法
  public set data(value: TFrameworkProps) {
    this._data = value;
  }
}

const frameworkProps = new FrameworkProps(initFrameworkProps);

export default frameworkProps;
