import React from 'react';
import { ChevronDown } from 'lucide-react';
import './WordStatusIndicator.css';

interface WordStatusIndicatorProps {
  level: number;
  onClick: () => void;
}

const statusLabels: Record<number, string> = {
  1: 'New',
  2: 'Recognized',
  3: 'Familiar',
  4: 'Learned',
};

export const WordStatusIndicator: React.FC<WordStatusIndicatorProps> = ({ level, onClick }) => {
  const clampedLevel = Math.max(1, Math.min(4, level));
  const label = statusLabels[clampedLevel];

  return (
    <button
      className={`word-status-indicator level-${clampedLevel}`}
      onClick={onClick}
      title={`${label} (${clampedLevel})`}
    >
      <span className="word-status-number">{clampedLevel}</span>
      <span className="word-status-label">{label}</span>
      <ChevronDown size={14} className="word-status-chevron" />
    </button>
  );
};
