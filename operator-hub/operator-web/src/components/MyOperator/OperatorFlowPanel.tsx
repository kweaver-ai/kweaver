import { useEffect, useRef, useState } from 'react';
import { Drawer } from 'antd';
import { useMicroWidgetProps } from '@/hooks';

export default function OperatorFlowPanel({ closeModal, selectoperator }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [loading, setLoading] = useState(true);
  const widgetElement = useRef(null);
  const microApp: any = useRef(null);

  useEffect(() => {
    const flowConfig = microWidgetProps?.config?.getMicroWidgetByName('flow-web-operator', true);
    setTimeout(() => {
      const microWidgetPropsNew = { selectoperator, closeModal, ...microWidgetProps };
      microApp.current = microWidgetProps?._qiankun?.loadMicroApp({
        name: flowConfig?.name,
        entry: flowConfig?.subapp?.entry, // 'https://localhost:3045/operatorFlow.html',
        container: widgetElement.current,
        props: {
          microWidgetProps: microWidgetPropsNew,
        },
      });
    }, 10);

    //  microApp.current?.loadPromise.then(
    //   () => {
    //     // 加载插件成功
    //         setLoading(false)
    //     try {
    //        setLoading(false)
    //     } catch {}
    //   },
    //   () => {
    //     // 加载插件失败
    //     // setOnline(navigator.onLine);
    //     // setLoadStatus(LoadStatus.Failed);
    //   }
    // );

    return () => {
      microApp.current?.unmount();
    };
  }, [widgetElement]);

  return (
    <Drawer
      open
      title={false}
      width={'100%'}
      height={'100%'}
      // loading={loading}
      placement="bottom"
      closable={false}
    >
      <div ref={widgetElement} />
    </Drawer>
  );
}
