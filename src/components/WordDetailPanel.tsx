import React from 'react';
import { PanelRightClose } from 'lucide-react';
import type { Word } from '../data/lesson';
import './WordDetailPanel.css';

interface WordDetailPanelProps {
  isOpen: boolean;
  view: string;
  word?: Word;
  wordLevel: number;
  onClose: () => void;
}

const tabs = ['Context', 'Meanings', 'Explanation', 'Dictionaries'];

export const WordDetailPanel: React.FC<WordDetailPanelProps> = ({
  isOpen,
  view,
  word,
  wordLevel,
  onClose,
}) => {
  if (!word) {
    return null;
  }

  const activeTab = 'Meanings';

  return (
    <aside className={`word-detail-panel ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="word-detail-header">
        <div className="word-detail-title-row">
          <div className="word-detail-title">
            <h2>{word.text}</h2>
            <p>{word.translation}</p>
          </div>
          <div className="word-detail-actions">
            <div className="word-detail-status">
              <span className="word-detail-level">{wordLevel}</span>
            </div>
            <button className="word-detail-close" onClick={onClose} type="button" aria-label="Close panel">
              <PanelRightClose size={18} />
            </button>
          </div>
        </div>
        <div className="word-detail-meta">
          <span className="word-detail-tag">Noun</span>
          <span className="word-detail-tag">Noun</span>
        </div>
      </div>

      <div className="word-detail-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={tab === activeTab ? 'word-detail-tab active' : 'word-detail-tab'}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="word-detail-content">
        <div className="word-detail-section">
          <div className="word-detail-section-title">Popular Meanings</div>
          <div className="word-detail-meaning-list">
            {['(the) illustration', 'the illustration/picture/artwork (f)', 'illustration'].map(item => (
              <div key={item} className="word-detail-meaning-item">
                <span>{item}</span>
                <button type="button">+</button>
              </div>
            ))}
          </div>
        </div>

        <div className="word-detail-section">
          <div className="word-detail-section-title">Add your own meaning</div>
          <input
            className="word-detail-input"
            type="text"
            placeholder="Type a new meaning here ..."
          />
        </div>
      </div>
    </aside>
  );
};
