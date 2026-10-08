import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useRef } from 'react';
import type { ToolStep } from '@/services/harness';
import MarkdownContent from './MarkdownContent';
import ToolProcess from './ToolProcess';
import styles from './style.less';

const PREVIEW_LENGTH = 140;

export function latestReasoningPreview(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= PREVIEW_LENGTH) return normalized;
  return `…${normalized.slice(-(PREVIEW_LENGTH - 1))}`;
}

const ReasoningBlock: React.FC<{ content?: string; tools?: ToolStep[]; running?: boolean }> = ({
  content = '',
  tools = [],
  running = false,
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const wasRunningRef = useRef(running);
  const preview = useMemo(() => latestReasoningPreview(content), [content]);

  useEffect(() => {
    if (wasRunningRef.current && !running) detailsRef.current?.removeAttribute('open');
    wasRunningRef.current = running;
  }, [running]);

  return (
    <details ref={detailsRef} className={styles.reasoningBlock} aria-label={running ? '思考中' : '已思考'}>
      <summary>
        <span className={styles.processStatusIcon} aria-hidden="true">
          {running ? <LoadingOutlined spin /> : <CheckCircleOutlined />}
        </span>
        <span className={styles.reasoningLabel}>{running ? '思考中' : '已思考'}</span>
        {running && preview && (
          <span className={styles.reasoningLiveViewport} data-testid="reasoning-live-preview" aria-hidden="true">
            <span className={styles.reasoningLiveText} key={`${content.length}-${preview.slice(-16)}`}>{preview}</span>
          </span>
        )}
      </summary>
      <div className={styles.processContent}>
        {content && (
          <div className={styles.reasoningContent}>
            <MarkdownContent content={content} streaming={running} compact />
          </div>
        )}
        <ToolProcess tools={tools} running={running} />
      </div>
    </details>
  );
};

export default ReasoningBlock;
