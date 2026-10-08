import { CheckOutlined, DownOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import React, { useState } from 'react';
import type { Capabilities, ReasoningEffort } from '@/services/harness';
import styles from '@/pages/Harness/style.less';

const reasoningLabel: Record<ReasoningEffort, string> = { off: 'Off', low: 'Low', high: 'High', max: 'Max' };
type SelectionPane = 'root' | 'model' | 'reasoning';

const ModelReasoningPicker: React.FC<{
  capabilities: Capabilities;
  model: string;
  reasoningEffort: ReasoningEffort;
  locked: boolean;
  onModelChange: (value: string) => void;
  onReasoningChange: (value: ReasoningEffort) => void;
}> = ({ capabilities, model, reasoningEffort, locked, onModelChange, onReasoningChange }) => {
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<SelectionPane>('root');
  const modelLabel = capabilities.models.find((item) => item.id === model)?.label || model || '选择模型';
  const effortLabel = reasoningLabel[reasoningEffort];
  const close = () => { setOpen(false); setPane('root'); };
  const menu = <div className={styles.modelMenu} role="menu" aria-label="模型与推理等级">
    {pane === 'root' && <>
      <button type="button" className={styles.modelMenuCell} onClick={() => setPane('model')}><span>模型</span><span className={styles.modelMenuValue}>{modelLabel}</span><RightOutlined /></button>
      <button type="button" className={styles.modelMenuCell} onClick={() => setPane('reasoning')}><span>推理等级</span><span className={styles.modelMenuValue}>{effortLabel}</span><RightOutlined /></button>
    </>}
    {pane !== 'root' && <button type="button" className={styles.modelMenuBack} onClick={() => setPane('root')}><LeftOutlined /><span>{pane === 'model' ? '选择模型' : '选择推理等级'}</span></button>}
    {pane === 'model' && <div className={styles.modelMenuOptions}>{capabilities.models.map((item) => <button type="button" className={`${styles.modelMenuOption} ${item.id === model ? styles.modelMenuSelected : ''}`} key={item.id} onClick={() => { onModelChange(item.id); close(); }}><span>{item.label}</span>{item.id === model && <CheckOutlined />}</button>)}</div>}
    {pane === 'reasoning' && <div className={styles.modelMenuOptions}>{(capabilities.reasoningEfforts || ['off', 'low', 'high', 'max']).map((item) => <button type="button" className={`${styles.modelMenuOption} ${item === reasoningEffort ? styles.modelMenuSelected : ''}`} key={item} onClick={() => { onReasoningChange(item); close(); }}><span>推理 {reasoningLabel[item]}</span>{item === reasoningEffort && <CheckOutlined />}</button>)}</div>}
  </div>;
  return <Popover content={menu} trigger="click" placement="topLeft" arrow={false} open={!locked && open} onOpenChange={(value) => { if (!locked) { setOpen(value); if (!value) setPane('root'); } }} overlayClassName={styles.modelPopover}>
    <button type="button" className={styles.modelTrigger} disabled={locked} aria-label={`模型 ${modelLabel}，推理等级 ${effortLabel}`}><span className={styles.modelTriggerLabel}>{modelLabel}</span><span className={styles.modelTriggerEffort}>{effortLabel}</span>{!locked && <DownOutlined className={styles.modelTriggerChevron} />}</button>
  </Popover>;
};

export default ModelReasoningPicker;
