import React from 'react';
import { ChevronDown } from 'lucide-react';
import './WordStatusIndicator.css';

interface WordStatusIndicatorProps {
  level: number;
  onClick: () => void;
  isOpen?: boolean;
}

const statusLabels: Record<number, string> = {
  1: 'New',
  2: 'Recognized',
  3: 'Familiar',
  4: 'Learned',
};

export const WordStatusIndicator: React.FC<WordStatusIndicatorProps> = ({
  level,
  onClick,
  isOpen = false,
}) => {
  const clampedLevel = Math.max(1, Math.min(4, level));
  const label = statusLabels[clampedLevel];

  return (
    <button
      className={`word-status-indicator level-${clampedLevel}`}
      onClick={onClick}
      title={`${label} (${clampedLevel})`}
    >
      <span className="word-status-number active">{clampedLevel}</span>
      <span className="word-status-label">{label}</span>
      <ChevronDown
        size={14}
        className={isOpen ? 'word-status-chevron open' : 'word-status-chevron'}
      />
    </button>
  );
};
