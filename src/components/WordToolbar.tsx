import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronRight, CircleCheck, HeartOff } from 'lucide-react';
import lynxIcon from '../assets/lynx-icon.png';
import sentenceReviewIcon from '../assets/sentence_review_icon.png';
import { WordStatusIndicator } from './WordStatusIndicator';
import './WordToolbar.css';

interface WordToolbarProps {
  wordId: string;
  wordText: string;
  wordTranslation?: string;
  wordElement: HTMLElement | null;
  wordLevel: number;
  onSetWordLevel: (wordId: string, level: number) => void;
  onOpenDetailPanel: (view: string, wordId: string) => void;
  onClose: () => void;
  onMarkAsKnown: (wordId: string) => void;
  onIgnore: (wordId: string) => void;
  onOpenAIChat: (wordText: string) => void;
  onInspectSentence: (wordId: string) => void;
}

export const WordToolbar: React.FC<WordToolbarProps> = ({
  wordId,
  wordText,
  wordTranslation,
  wordElement,
  wordLevel,
  onSetWordLevel,
  onOpenDetailPanel,
  onClose,
  onMarkAsKnown,
  onIgnore,
  onOpenAIChat,
  onInspectSentence,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const translation = wordTranslation || wordText;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const element = wordElement || document.getElementById(wordId);
      if (!element || !toolbarRef.current) return;

      const rect = element.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current.offsetHeight || 0;
      const toolbarWidth = toolbarRef.current.offsetWidth || 0;
      
      // Position toolbar above the word, centered horizontally
      const top = rect.top - toolbarHeight - 8; // 8px gap
      const left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
      
      // Ensure toolbar stays within viewport
      const viewportWidth = window.innerWidth;
      
      let adjustedLeft = Math.max(10, Math.min(left, viewportWidth - toolbarWidth - 10));
      let adjustedTop = top;
      
      // If toolbar would go above viewport, position it below the word
      if (adjustedTop < 10) {
        adjustedTop = rect.bottom + 8;
      }
      
      setPosition({ top: adjustedTop, left: adjustedLeft });
    };

    // Initial position update with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePosition, 0);
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [wordElement, wordId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node) &&
        wordElement &&
        !wordElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, wordElement]);

  const handleMarkAsKnown = () => {
    onMarkAsKnown(wordId);
    onClose();
  };

  const handleIgnore = () => {
    onIgnore(wordId);
    onClose();
  };

  const handleToggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const handleSetLevel = (level: number) => {
    onSetWordLevel(wordId, level);
    setMenuOpen(false);
  };

  const handleAIChat = () => {
    onOpenAIChat(wordText);
    onOpenDetailPanel('ai', wordId);
    onClose();
  };

  const handleInspectSentence = () => {
    onInspectSentence(wordId);
    onOpenDetailPanel('sentence', wordId);
    onClose();
  };

  const handleOpenDetails = () => {
    onOpenDetailPanel('details', wordId);
    onClose();
  };

  const handleOpenDefinition = () => {
    onOpenDetailPanel('meanings', wordId);
    onClose();
  };

  return (
    <div
      ref={toolbarRef}
      className="word-toolbar"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="word-toolbar-content">
        {/* Translation */}
        <div className="word-toolbar-translation">
          <button className="word-toolbar-definition" type="button" onClick={handleOpenDefinition}>
            <span className="word-toolbar-definition-text">{translation}</span>
            <span className="word-toolbar-definition-icon">
              <ChevronRight size={16} />
            </span>
          </button>
        </div>

        <div className="word-toolbar-divider" />

        {/* AI Chat */}
        <button
          className="word-toolbar-button word-toolbar-tooltip"
          onClick={handleAIChat}
          data-tooltip="Chat with Lynx AI"
        >
          <img src={lynxIcon} alt="Lynx AI" className="word-toolbar-icon" />
        </button>

        {/* Inspect Sentence */}
        <button
          className="word-toolbar-button word-toolbar-tooltip"
          onClick={handleInspectSentence}
          data-tooltip="Inspect Sentence"
        >
          <img src={sentenceReviewIcon} alt="Inspect Sentence" className="word-toolbar-icon" />
        </button>

        <div className="word-toolbar-divider" />

        <div className="word-toolbar-status">
          <div className="word-toolbar-menu">
            <WordStatusIndicator level={wordLevel} onClick={handleToggleMenu} />
            {menuOpen && (
              <div className="word-toolbar-menu-popover">
                <div className="word-toolbar-menu-levels">
                  {[
                    { level: 1, label: 'New' },
                    { level: 2, label: 'Recognized' },
                    { level: 3, label: 'Familiar' },
                    { level: 4, label: 'Learned' },
                  ].map(item => (
                    <button
                      key={item.level}
                      className={
                        item.level === wordLevel
                          ? 'word-toolbar-level-button active'
                          : 'word-toolbar-level-button'
                      }
                      onClick={() => handleSetLevel(item.level)}
                      type="button"
                    >
                      <span className="word-toolbar-level-number">{item.level}</span>
                      <span className="word-toolbar-level-label">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="word-toolbar-menu-actions">
                  <button
                    className="word-toolbar-menu-action"
                    onClick={handleMarkAsKnown}
                    type="button"
                  >
                    <CircleCheck size={16} />
                    Known
                  </button>
                  <button
                    className="word-toolbar-menu-action ignore"
                    onClick={handleIgnore}
                    type="button"
                  >
                    <HeartOff size={16} />
                    Ignore
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="word-toolbar-divider" />

        <button
          className="word-toolbar-button word-toolbar-tooltip"
          onClick={handleOpenDetails}
          data-tooltip="Open details"
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
    </div>
  );
};
