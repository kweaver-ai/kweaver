import GradientContainer from '@/components/GradientContainer';
import EmptyIcon from '@/assets/images/empty.svg';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const AgentNotExist = () => {
  const navigate = useNavigate();
  return (
    <GradientContainer className="dip-full dip-flex-center">
      <div className="dip-flex-column-center">
        <EmptyIcon />
        <div>Data Agent已下架</div>
        <div className="dip-mt-12 dip-text-color-45">抱歉，您访问的Data Agent似乎已被管理员移除或暂时不可用。</div>
        <Button onClick={() => navigate(-1)} className="dip-mt-16">
          返回
        </Button>
      </div>
    </GradientContainer>
  );
};

export default AgentNotExist;
