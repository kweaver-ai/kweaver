import React, {useState, useEffect} from 'react';
import BlogPostItem from '@theme-original/BlogPostItem';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {useColorMode} from '@docusaurus/theme-common';
import Giscus from '@giscus/react';

function ReactionCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://giscus.app') return;
      const data = event.data?.giscus;
      if (!data?.discussion) return;
      const total = data.discussion.reactions?.totalCount;
      if (typeof total === 'number') {
        setCount(total);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (count === null) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        margin: '0.5rem 0 1rem',
        fontSize: '0.95rem',
        color: 'var(--ifm-color-emphasis-700)',
        cursor: 'pointer',
      }}
      title="点击查看详情"
      onClick={() => {
        document.querySelector('.giscus')?.scrollIntoView({behavior: 'smooth'});
      }}
    >
      <span style={{fontSize: '1.1rem'}}>👍</span>
      <span>{count} 个赞</span>
    </div>
  );
}

const GISCUS_PROPS = {
  repo: 'kweaver-ai/kweaver' as const,
  repoId: 'R_kgDOH8FKww',
  category: 'Announcements',
  categoryId: 'DIC_kwDOH8FKw84C4wpZ',
  mapping: 'pathname' as const,
  strict: '0' as const,
  reactionsEnabled: '1' as const,
  emitMetadata: '1' as const,
  inputPosition: 'bottom' as const,
  lang: 'zh-CN',
};

export default function BlogPostItemWrapper(props) {
  const {isBlogPostPage} = useBlogPost();
  const {colorMode} = useColorMode();

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage && (
        <>
          <ReactionCount />
          <div style={{marginTop: '2rem'}}>
            <Giscus
              {...GISCUS_PROPS}
              theme={colorMode === 'dark' ? 'dark' : 'light'}
            />
          </div>
        </>
      )}
    </>
  );
}
