import {
  AppstoreOutlined,
  ArrowUpOutlined,
  BellOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  HomeOutlined,
  LeftOutlined,
  MenuOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import { Avatar, Breadcrumb, Button, Drawer, Empty, Input, Popover, Tooltip, Typography } from 'antd';
import type { InputRef } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AvatarDropdown } from '@/components/RightContent/AvatarDropdown';
import { LangDropdown } from '@/components/RightContent/LangDropdown';
import { useConsoleUi } from './context';
import { getConsoleModules, getConsolePage, readRecentPages } from './navigation';
import type { ConsoleModule, ConsolePage } from './navigation';
import appConfig from '@root/config/appConfig';
import styles from './style.module.less';

const railPrefix = 'go-ant-design-pro-admin:console-rail:';

function isWorkspace(pathname: string) {
  return pathname === '/workspace';
}

function isSpecialWorkspace(pathname: string) {
  return pathname.startsWith('/harness') || pathname.startsWith('/knowledge');
}

function navigate(path: string, closeCatalog?: () => void) {
  closeCatalog?.();
  history.push(path);
}

export const ConsoleHeader: React.FC<{ user?: API.CurrentUser }> = ({ user }) => {
  const { catalogOpen, closeCatalog, openCatalog } = useConsoleUi();
  const location = useLocation();
  return (
    <header className={styles.globalHeader}>
      <Button
        className={styles.catalogTrigger}
        type="text"
        icon={catalogOpen ? <CloseOutlined /> : <MenuOutlined />}
        onClick={catalogOpen ? closeCatalog : () => openCatalog()}
        aria-label={catalogOpen ? '关闭产品目录' : '打开产品目录'}
        aria-expanded={catalogOpen}
      />
      <a className={styles.brand} href="/workspace" aria-label={`${appConfig.name} 首页`}>
        <img src="/icons/icon-128x128.png" alt="" /><strong>{appConfig.name}</strong>
      </a>
      <Button
        className={isWorkspace(location.pathname) ? styles.activeWorkspace : ''}
        type="text"
        icon={<HomeOutlined />}
        onClick={() => navigate('/workspace')}
        aria-label="工作台"
      >
        工作台
      </Button>
      <div className={styles.headerSpacer} />
      <Button className={styles.searchTrigger} icon={<SearchOutlined />} onClick={() => openCatalog()} aria-label="搜索产品与页面">
        <span>搜索产品与页面</span>
      </Button>
      <a className={styles.headerLink} href="https://github.com/zwbsxwt/go-ant-design-pro-admin#readme" target="_blank" rel="noreferrer"><BookOutlined /><span>文档</span></a>
      <LangDropdown />
      <Popover placement="bottomRight" trigger="click" content={<Typography.Text type="secondary">消息中心尚未接入，暂无系统消息。</Typography.Text>}>
        <Button type="text" icon={<BellOutlined />} aria-label="消息" />
      </Popover>
      {user && <AvatarDropdown>
        <button type="button" className={styles.accountTrigger} aria-label="账号信息">
          <span className={styles.accountName}>{user.name || user.username || '用户'}<small>{user.roleCodes?.join('、') || '账号'}</small></span>
          <Avatar size={30} src={user.avatar}>{(user.name || user.username || '用').slice(0, 1)}</Avatar>
        </button>
      </AvatarDropdown>}
    </header>
  );
};

type CatalogProps = {
  user?: API.CurrentUser;
  modules: ConsoleModule[];
};

const ProductCatalog: React.FC<CatalogProps> = ({ user, modules }) => {
  const { catalogOpen, catalogMode, closeCatalog, openCatalog } = useConsoleUi();
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const [query, setQuery] = useState('');
  const inputRef = useRef<InputRef>(null);
  const recent = readRecentPages(user, modules);
  const selectedModule = modules.find((module) => module.id === selectedModuleId);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleModules = normalizedQuery
    ? modules
        .map((module) => ({
          ...module,
          pages: module.pages.filter((page) =>
            `${module.name} ${page.name} ${page.parents.join(' ')}`.toLocaleLowerCase().includes(normalizedQuery)
          ),
        }))
        .filter((module) => module.pages.length > 0)
    : selectedModule
      ? [selectedModule]
      : modules;

  useEffect(() => {
    if (!catalogOpen) {
      setQuery('');
      setSelectedModuleId(undefined);
    }
  }, [catalogOpen]);

  function renderPage(page: ConsolePage) {
    return (
      <button className={styles.catalogPage} key={page.path} type="button" onClick={() => navigate(page.path, closeCatalog)}>
        <span>{page.name}</span>
      </button>
    );
  }

  return (
    <Drawer
      placement="left"
      width="min(1040px, calc(100vw - 32px))"
      open={catalogOpen}
      rootStyle={{ top: 56 }}
      onClose={closeCatalog}
      afterOpenChange={(open) => { if (open && catalogMode === 'all') inputRef.current?.focus(); }}
      className={styles.catalogDrawer}
      rootClassName={styles.catalogRoot}
      closable={false}
      keyboard
      focusable={{ trap: true, focusTriggerAfterClose: true }}
    >
      <div className={styles.catalogLayout}>
        <nav className={styles.catalogCategories} aria-label="产品分类">
          <button className={styles.catalogNavPrimary} type="button" onClick={() => navigate('/workspace', closeCatalog)}><HomeOutlined />工作台</button>
          <button className={`${styles.catalogNavPrimary} ${catalogMode === 'recent' ? styles.selectedPrimary : ''}`} type="button" onClick={() => openCatalog('recent')}><ClockCircleOutlined />最近访问</button>
          <button className={`${styles.catalogNavPrimary} ${catalogMode === 'all' ? styles.selectedPrimary : ''}`} type="button" onClick={() => openCatalog('all')}><AppstoreOutlined />产品与服务</button>
          {catalogMode === 'all' && <div className={styles.categoryList}>
            <button className={!selectedModuleId ? styles.selectedCategory : ''} type="button" onClick={() => { setSelectedModuleId(undefined); setQuery(''); }}>全部</button>
            {modules.map((module) => (
              <button
                key={module.id}
                className={selectedModuleId === module.id ? styles.selectedCategory : ''}
                type="button"
                onClick={() => { setSelectedModuleId(module.id); setQuery(''); }}
              >
                <span>{module.name}</span>
              </button>
            ))}
          </div>}
        </nav>
        <div className={styles.catalogMain}>
          {catalogMode === 'recent' ? <>
            <Typography.Title level={5}>最近访问</Typography.Title>
            <Typography.Text type="secondary">最近使用的授权页面</Typography.Text>
            <div className={styles.recentPanel}>{recent.length ? recent.map(renderPage) : <Empty description="暂无最近访问，可从产品目录进入页面" />}</div>
          </> : <>
            <Typography.Title level={5}>产品与服务</Typography.Title>
            <Typography.Text type="secondary">点击可前往业务页面</Typography.Text>
            <Input
              ref={inputRef}
              prefix={<SearchOutlined />}
              placeholder="搜索产品或页面"
              aria-label="搜索产品或页面"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              allowClear
              className={styles.catalogSearch}
            />
            {visibleModules.length ? visibleModules.map((module) => (
              <section className={styles.catalogSection} key={module.id}>
                <Typography.Title level={5}>{module.name}</Typography.Title>
                <div className={styles.catalogPageGrid}>{module.pages.map(renderPage)}</div>
              </section>
            )) : <Empty description="没有匹配的授权页面" />}
          </>}
        </div>
      </div>
    </Drawer>
  );

};

type RailProps = { user?: API.CurrentUser; modules: ConsoleModule[]; pathname: string };

const ConsoleRail: React.FC<RailProps> = ({ user, modules, pathname }) => {
  const { openCatalog } = useConsoleUi();
  const identity = user?.userid || user?.username || '';
  const key = identity ? `${railPrefix}${encodeURIComponent(identity)}` : undefined;
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = key ? window.localStorage.getItem(key) : null;
    return stored === null ? window.innerWidth < 900 : stored === 'collapsed';
  });
  const recent = readRecentPages(user, modules);

  useEffect(() => {
    if (!key) return;
    const stored = window.localStorage.getItem(key);
    setCollapsed(stored === null ? window.innerWidth < 900 : stored === 'collapsed');
  }, [key]);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      if (key) {
        try { window.localStorage.setItem(key, next ? 'collapsed' : 'expanded'); } catch { /* preference is optional */ }
      }
      return next;
    });
  }

  return (
    <aside className={`${styles.rail} ${collapsed ? styles.railCollapsed : ''}`} aria-label="全局工具栏">
      {!collapsed && <div className={styles.railActions}>
        <Tooltip placement="left" title="产品目录"><Button type="text" icon={<AppstoreOutlined />} aria-label="工具栏产品目录" onClick={() => openCatalog()} /></Tooltip>
        {recent.length > 0 && <Tooltip placement="left" title="最近访问"><Button type="text" icon={<ClockCircleOutlined />} aria-label="工具栏最近访问" onClick={() => openCatalog('recent')} /></Tooltip>}
        {!isSpecialWorkspace(pathname) && <Tooltip placement="left" title="返回顶部"><Button type="text" icon={<ArrowUpOutlined />} aria-label="返回顶部" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} /></Tooltip>}
      </div>}
      <Tooltip placement="left" title={collapsed ? '展开工具栏' : '收起工具栏'}>
        <Button className={styles.railToggle} type="text" icon={collapsed ? <LeftOutlined /> : <RightOutlined />} aria-label={collapsed ? '展开工具栏' : '收起工具栏'} onClick={toggle} />
      </Tooltip>
    </aside>
  );
};

type FrameProps = React.PropsWithChildren<{ user?: API.CurrentUser }>;

export const ConsoleFrame: React.FC<FrameProps> = ({ user, children }) => {
  const location = useLocation();
  const modules = useMemo(() => getConsoleModules(user), [user]);
  const pathname = location.pathname;
  const page = getConsolePage(modules, pathname);
  const module = modules.find((item) => item.id === page?.moduleId);
  const workspace = isWorkspace(pathname);
  const special = isSpecialWorkspace(pathname);
  const showSampleTitle = pathname === '/system/user' || pathname === '/quantitative-trading/industry-flow';
  return (
    <div className={`${styles.frame} ${workspace ? styles.workspaceFrame : ''} ${special ? styles.specialFrame : ''}`}>
      {workspace && <nav className={styles.workspaceTabs} aria-label="工作台分区">
        <div className={styles.workspaceTabsInner}>
          <a href="#workspace-overview">概览</a>
          <a href="#workspace-products">产品与服务</a>
        </div>
      </nav>}
      {!workspace && !special && page && <div className={styles.pageHeader}>
        <Breadcrumb items={[{ title: <a onClick={() => navigate('/workspace')}>工作台</a> }, { title: module?.name || '' }, ...page.parents.map((name) => ({ title: name })), { title: page.name }]} />
        {showSampleTitle && <Typography.Title level={3}>{page.name}</Typography.Title>}
      </div>}
      <div className={styles.frameContent}>{children}</div>
      <ConsoleRail user={user} modules={modules} pathname={pathname} />
      <ProductCatalog user={user} modules={modules} />
    </div>
  );
};
