import { IconFont } from '@/web-library/common';

const ObjectIcon = (props: { icon: string; color: string }) => {
  const { icon, color } = props;
  return (
    <div className="g-mr-2 g-p-1 g-flex-center" style={{ background: color, borderRadius: 3 }}>
      <IconFont type={icon} style={{ color: '#fff', fontSize: 16 }} />
    </div>
  );
};

export default ObjectIcon;
