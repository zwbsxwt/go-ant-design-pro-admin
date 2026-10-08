import { AppstoreOutlined, ArrowRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Empty, Typography } from 'antd';
import React from 'react';
import { getConsoleModules, readRecentPages } from '@/components/ConsoleShell/navigation';
import styles from './style.module.less';

const Workspace: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const user = initialState?.currentUser;
  const modules = getConsoleModules(user);
  const recent = readRecentPages(user, modules);

  return (
    <main className={styles.workspace} id="workspace-overview">
      <section className={styles.recentSection} aria-labelledby="recent-title">
        <div className={styles.sectionTitle}><ClockCircleOutlined /><Typography.Title id="recent-title" level={5}>最近访问</Typography.Title></div>
        {recent.length ? (
          <div className={styles.recentLinks}>
            {recent.slice(0, 6).map((page) => <Button key={page.path} type="link" onClick={() => history.push(page.path)}>{page.name}</Button>)}
          </div>
        ) : <Typography.Text type="secondary">从下方进入业务页面，访问记录会显示在这里。</Typography.Text>}
      </section>

      <section className={styles.productSection} id="workspace-products" aria-labelledby="products-title">
        <div className={styles.sectionTitle}><AppstoreOutlined /><Typography.Title id="products-title" level={4}>产品与服务</Typography.Title></div>
        <Typography.Paragraph type="secondary">按业务域进入工作区，页面入口由当前账号的权限决定。</Typography.Paragraph>
        {modules.length ? <div className={styles.productGrid}>
          {modules.slice(0, 6).map((module) => (
            <article className={styles.productCard} key={module.id}>
              <div className={styles.productHeader}>
                <Typography.Title level={5}>{module.name}</Typography.Title>
                <Button type="link" icon={<ArrowRightOutlined />} aria-label={`进入${module.name}`} onClick={() => history.push(module.pages[0].path)} />
              </div>
              <div className={styles.productLinks}>
                {module.pages.slice(0, 4).map((page) => <Button key={page.path} type="text" onClick={() => history.push(page.path)}>{page.name}</Button>)}
              </div>
            </article>
          ))}
        </div> : <Empty description="当前账号暂无可访问的产品页面" />}
      </section>
    </main>
  );
};

export default Workspace;
