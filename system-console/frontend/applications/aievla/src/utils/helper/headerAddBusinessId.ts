const headerAddBusinessId = () => {
  const headers: any = { headers: {} };
  const xBusinessDomain = window?.sessionStorage?.getItem('studio.businessDomainID');
  if (xBusinessDomain) headers.headers['x-business-domain'] = xBusinessDomain.trim().replace(/^['"]|['"]$/g, '');
  return headers;
};

export default headerAddBusinessId;
