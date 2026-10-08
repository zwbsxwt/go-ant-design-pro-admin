import { Bubble } from '@ant-design/x';
import { Empty } from 'antd';
import React from 'react';
import type { HarnessMessage } from '@/services/harness';
import MarkdownContent from '@/pages/Harness/MarkdownContent';
import ReasoningBlock from '@/pages/Harness/ReasoningBlock';
import styles from '@/pages/Harness/style.less';

export type HarnessMessageStreamProps = {
  messages: HarnessMessage[];
  running?: boolean;
  emptyText?: string;
  userBubbleVariant?: 'filled' | 'outlined' | 'shadow' | 'borderless';
  fullWidth?: boolean;
  onOpenCitation?: (citation: NonNullable<HarnessMessage['citations']>[number]) => void;
  sessionId?: string;
  onMessageRef?: (key: string, node: HTMLDivElement | null) => void;
};

const HarnessMessageStream: React.FC<HarnessMessageStreamProps> = ({
  messages,
  running = false,
  emptyText = '发送一条消息开始对话',
  userBubbleVariant = 'filled',
  fullWidth = false,
  onOpenCitation,
  sessionId = 'session',
  onMessageRef,
}) => {
  if (messages.length === 0) return <Empty description={emptyText} />;
  return (
    <div className={`${styles.messageStream} ${fullWidth ? styles.messageStreamFullWidth : ''}`}>
      {messages.map((item, index) => {
        const isThinking = item.role === 'assistant' && index === messages.length - 1 && running;
        const key = `${sessionId}-${index}`;
        return (
          <div className={`${styles.messageRow} ${item.role === 'assistant' ? styles.assistantRow : styles.userRow}`} key={item.id || key} ref={(node) => onMessageRef?.(key, node)}>
            {item.role === 'assistant' ? (
              <div className={styles.assistantMessage}>
                {(item.reasoning || item.tools?.length) && <ReasoningBlock content={item.reasoning} tools={item.tools} running={isThinking} />}
                {item.content && <div className={styles.assistantContent}><MarkdownContent content={item.content} streaming={isThinking} /></div>}
                {item.citations && item.citations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBlockStart: 12 }}>
                    {item.citations.map((citation) => (
                      <button
                        key={citation.citationId}
                        type="button"
                        onClick={() => onOpenCitation?.(citation)}
                        style={{ border: 0, background: 'transparent', color: 'var(--ant-color-primary)', cursor: 'pointer', padding: 0 }}
                      >
                        {citation.title || citation.path || citation.citationId}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Bubble placement="end" content={item.content} variant={userBubbleVariant} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HarnessMessageStream;
