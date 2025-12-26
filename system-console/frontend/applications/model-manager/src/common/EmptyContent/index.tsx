import classNames from 'classnames';
import create from '@/assets/images/file-icon/create.svg';
import not_found from '@/assets/images/file-icon/not_found.svg';
import file_empty from '@/assets/images/file-icon/file_empty.svg';

const EMPTY_IMG_OBJ: any = {
  create,
  fileEmpty: file_empty,
  notFound: not_found,
};

export type EmptyContentProps = {
  type: string;
  image?: string;
  description?: React.ReactNode;
  styles?: {
    container?: React.CSSProperties;
    image?: React.CSSProperties;
  };
  className?: string;
};

const EmptyContent = (props: EmptyContentProps) => {
  const { type, image, description, styles, className } = props;
  const { container: containerStyle = {}, image: imgStyle = {} } = styles || {};
  return (
    <div className={classNames('g-flex-column-center', className)} style={containerStyle}>
      <img src={image || EMPTY_IMG_OBJ[type]} style={{ width: 140, height: 140, ...imgStyle }} />
      <div className='g-mt-2 g-c-text	g-flex-center'>{description}</div>
    </div>
  );
};

export default EmptyContent;
