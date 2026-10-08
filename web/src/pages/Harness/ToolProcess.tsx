import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, SearchOutlined, ToolOutlined } from '@ant-design/icons';
import React from 'react';
import type { ToolStep } from '@/services/harness';
import styles from './style.less';

const SEARCH_KEYS = ['query', 'q', 'keyword', 'keywords', 'search_query', 'searchQuery', 'queries'];

function argumentSummary(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  for (const key of SEARCH_KEYS) {
    const candidate = record[key];
    if (typeof candidate === 'string') return candidate;
    if (Array.isArray(candidate)) return candidate.map(String).join('、');
  }
  for (const key of ['path', 'file_path', 'command', 'description', 'url']) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  return '';
}

function isSearchTool(name: string) {
  return /search|web|query/i.test(name);
}

function pretty(value: unknown): string {
  if (value === undefined || value === null || value === '') return '暂无内容';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

const ToolProcess: React.FC<{ tools: ToolStep[]; running?: boolean }> = ({ tools, running }) => {
  if (!tools.length) return null;
  return <section className={styles.toolProcess} aria-label="工具执行步骤">
    {tools.map((tool) => {
      const searching = isSearchTool(tool.name);
      const summary = argumentSummary(tool.arguments);
      const active = tool.status === 'running' && running;
      const icon = active ? <LoadingOutlined spin /> : tool.status === 'failed' ? <CloseCircleOutlined /> : <CheckCircleOutlined />;
      return <details className={`${styles.toolStep} ${styles[`toolStep_${tool.status}`] || ''}`} key={tool.callId} style={{ marginLeft: tool.parentCallId ? 20 : 0 }}>
        <summary>
          <span className={styles.toolStatus}>{icon}</span>
          <span className={styles.toolKind}>{searching ? <SearchOutlined /> : <ToolOutlined />}{active ? (searching ? '正在搜索' : '正在调用') : (searching ? '已完成搜索' : tool.status === 'failed' ? '调用失败' : '调用完成')}</span>
          <span className={styles.toolName}>{tool.name}</span>
          {tool.source === 'ptc' && <span className={styles.toolPtc}>PTC</span>}
          {summary && <span className={styles.toolSummary}>{summary}</span>}
        </summary>
        <div className={styles.toolDetail}>
          <div className={styles.toolDetailSection}><span>调用参数</span><pre>{pretty(tool.arguments)}</pre>{tool.argumentsTruncated && <small>参数已按安全上限截断</small>}</div>
          <div className={styles.toolDetailSection}><span>{tool.isError ? '错误结果' : '返回结果'}</span><pre>{pretty(tool.content || tool.error)}</pre>{tool.contentTruncated && <small>结果已按安全上限截断</small>}</div>
        </div>
      </details>;
    })}
  </section>;
};

export default ToolProcess;
