import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Route, Switch, useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import { matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import frameworkProps from '@/utils/axios-http/frameworkProps';
import api from '@/services/Knowledge-network';
import KnowledgeNetworkType from '@/services/Knowledge-network/type';
import Action from '@/pages/Action';
import ConceptGroup from '@/pages/ConceptGroup';
import Edge from '@/pages/Edge';
import Object from '@/pages/Object';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';
import Overview from './Overview';
import KnowledgeNetworkPreview from '../KnowledgeNetworkPreview';
import Task from '../Task';

interface TLinkItem {
  icon: string;
  title: string;
  url: string;
  count?: number;
  isActive: boolean;
  style?: React.CSSProperties;
}
const LinkItem = (props: TLinkItem) => {
  const history = useHistory();
  const { icon = 'icon-dip-chakanbangdan', title, count, url, isActive, style } = props;
  const isShowCount = count !== undefined && count !== null;
  const curCount = count && count > 9999 ? '9999+' : count;

  const toPath = () => {
    history.push(url);
  };

  return (
    <div className={classnames(styles['side-item'], isActive && styles['side-item-active'])} onClick={toPath} style={style}>
      <dl>
        <dt>
          <IconFont type={icon} style={{ color: isActive ? '#126ee3' : '#000', fontSize: 16 }} />
        </dt>
        <dd>{title}</dd>
      </dl>
      {isShowCount && <span className={styles['side-item-count']}>{curCount}</span>}
    </div>
  );
};

const KnowledgeNetworkOverview = () => {
  const history = useHistory();
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const [detail, setdetail] = useState<KnowledgeNetworkType.Detail>();
  const [active, setActive] = useState<string>('overview');

  const getDetail = async (val: string) => {
    const res = await api.detailNetwork({ knIds: [val], include_statistics: true });
    setdetail(res);
  };

  const goback = () => {
    history.push('/');
  };

  useEffect(() => {
    const last = pathname.split('/').pop() as string;
    setActive(last);
  }, [pathname]);

  useEffect(() => {
    frameworkProps.data.toggleSideBarShow(false);
    const query = new URLSearchParams(window.location.search);
    const id = query.get('id');
    const paramId = id || localStorage.getItem('KnowledgeNetwork.id');
    if (paramId) {
      getDetail(paramId);
    }

    // return () => {
    //     frameworkProps.data.toggleSideBarShow(true);
    // };
  }, []);

  const isPermission = useMemo(() => {
    return matchPermission(PERMISSION_CODES.MODIFY, detail?.operations || []);
  }, [JSON.stringify(detail)]);

  return (
    <div className={styles['main-box']}>
      <div className={styles['main-header']}>
        <LeftOutlined onClick={goback} />
        <div className={styles['name-icon']} style={{ background: detail?.color }}>
          <IconFont type={detail?.icon || ''} style={{ color: '#fff', fontSize: 14 }} />
        </div>
        <h4 style={{ fontSize: 14 }}>{detail?.name}</h4>
      </div>
      <div className={styles['main-layout']}>
        <div className={styles['main-side']}>
          <LinkItem icon="icon-dip-tail" isActive={active === 'overview'} title={intl.get('KnowledgeNetwork.overview')} url={`${path}/overview`} />
          <LinkItem icon="icon-dip-KG1" isActive={active === 'preview'} title={intl.get('KnowledgeNetwork.ontologyModelingPreview')} url={`${path}/preview`} />
          <div className={styles.line}></div>
          <div className={styles.title}>{intl.get('KnowledgeNetwork.resource')}</div>
          <LinkItem
            icon="icon-dip-duixianglei"
            isActive={active === 'object'}
            title={intl.get('Global.objectClass')}
            url={`${path}/object`}
            count={detail?.statistics?.object_types_total || 0}
          />
          <LinkItem
            icon="icon-dip-guanxilei"
            isActive={active === 'relation'}
            title={intl.get('Global.edgeClass')}
            url={`${path}/relation`}
            count={detail?.statistics?.relation_types_total || 0}
          />
          <LinkItem
            icon="icon-dip-hangdonglei"
            isActive={active === 'action'}
            title={intl.get('Global.actionClass')}
            url={`${path}/action`}
            count={detail?.statistics?.action_types_total || 0}
          />
          <div className={styles.line}></div>
          <LinkItem
            icon="icon-dip-fenzu"
            count={detail?.statistics?.concept_groups_total || 0}
            isActive={active === 'concept-group'}
            title={intl.get('ConceptGroup.conceptGroup')}
            url={`${path}/concept-group`}
          />
          <LinkItem icon="icon-dip-task" isActive={active === 'task'} title={intl.get('Global.taskManagement')} url={`${path}/task`} />
        </div>
        <div className={styles['main-content']}>
          <Switch>
            <Route exact path={`${path}/overview`} render={() => <Overview detail={detail} isPermission={isPermission} callback={getDetail} />} />
            <Route exact path={`${path}/object`} render={() => <Object detail={detail} isPermission={isPermission} />} />
            <Route exact path={`${path}/relation`} render={() => <Edge detail={detail} isPermission={isPermission} />} />
            <Route exact path={`${path}/action`} render={() => <Action detail={detail} isPermission={isPermission} />} />
            <Route exact path={`${path}/concept-group`} render={() => <ConceptGroup detail={detail} isPermission={isPermission} />} />
            <Route exact path={`${path}/task`} render={() => <Task detail={detail} isPermission={isPermission} />} />
            <Route exact path={`${path}/preview`} render={() => <KnowledgeNetworkPreview detail={detail} isPermission={isPermission} />} />
            <Route render={() => <div>{intl.get('Global.pageNotFound')}</div>} />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeNetworkOverview;
