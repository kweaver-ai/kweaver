import { useEffect, useRef } from 'react';
import './style.less';
import { useMicroWidgetProps } from '@/hooks';
import { useParams } from 'react-router-dom';

export default function OperatorDetailFlow({}) {
  const microWidgetProps = useMicroWidgetProps();
  const { id: dag_id = '' } = useParams<{ id: string }>();
  const widgetElement = useRef(null);
  const microApp: any = useRef(null);

  useEffect(() => {
    const flowConfig = microWidgetProps?.config?.getMicroWidgetByName('operator-flow-detail', true);
    setTimeout(() => {
      const microWidgetPropsNew = { selectoperator: { dag_id }, ...microWidgetProps };
      microApp.current = microWidgetProps?._qiankun?.loadMicroApp({
        name: flowConfig?.name,
        entry: flowConfig?.subapp?.entry,
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
  return <div ref={widgetElement} />;
}
