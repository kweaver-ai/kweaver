import intl from 'react-intl-universal';

export const planTypes = {
  'net-search': {
    label: intl.get('dipChat.netSearch'),
    icon: 'icon-dip-net',
    colorIcon: 'icon-dip-color-net',
  },
  'graph-search': {
    label: intl.get('dipChat.graphSearch'),
    icon: 'icon-dip-graph-qa',
    colorIcon: 'icon-dip-color-graph',
  },
  'doc-search': {
    label: intl.get('dipChat.docSearch'),
    icon: 'icon-dip-doc-qa',
    colorIcon: 'icon-dip-color-doc-qa',
  },
  summary: {
    label: intl.get('dipChat.articleWriting'),
    icon: 'icon-dip-write',
    colorIcon: 'icon-dip-color-report',
  },
};
