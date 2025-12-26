import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useBeforeUnload } from 'react-router-dom';

const useNavigationGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const prevent = useRef(false); // 是否拦截
  const [openConfirm, setOpenConfirm] = useState(false); // 是否打开确认弹窗

  // 页面回退拦截
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (prevent.current) {
        event.preventDefault();
        setOpenConfirm(true);
        history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [prevent.current, location.pathname]);

  // 页面卸载拦截
  useBeforeUnload(
    event => {
      if (prevent.current) event.preventDefault();
    },
    { capture: true },
  );

  // 安全导航方法
  const safeNavigate = useCallback(
    (toPath: any, data?: any) => {
      if (prevent.current) {
        setOpenConfirm(true);
      } else {
        navigate(toPath, data);
      }
    },
    [prevent.current],
  );
  const onChangePrevent = (value: boolean) => {
    prevent.current = value;
  }; // 设置是否拦截
  const onChangeOpenConfirm = (value: boolean) => setOpenConfirm(value); // 设置是否打开确认弹窗

  return { safeNavigate, prevent, onChangePrevent, openConfirm, onChangeOpenConfirm };
};

export default useNavigationGuard;
