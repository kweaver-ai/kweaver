import NotFoundImg from '@/assets/images/404.svg';
import './style.less';

const NotFound = () => {
  return (
    <div className='not-found'>
      <img src={NotFoundImg} alt='404' className='notfound-bgi' />
    </div>
  );
};

export default NotFound;
