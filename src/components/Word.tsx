import React from 'react';
import type { Word as WordType } from '../data/lesson';
import './Word.css';

interface WordProps {
  word: WordType;
  isClicked: boolean;
  isLingQ: boolean;
  onClick: (wordId: string) => void;
  onPointerDown: (wordId: string) => void;
  onPointerEnter: (wordId: string) => void;
  onPointerUp: () => void;
  isKnown: boolean;
  isIgnored: boolean;
}

export const Word: React.FC<WordProps> = ({
  word,
  isClicked,
  isLingQ,
  onClick,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  isKnown,
  isIgnored,
}) => {
  const handleClick = () => {
    // Don't allow interaction with known or ignored words
    if (isKnown || isIgnored) {
      return;
    }
    onClick(word.id);
  };

  // Determine the class name based on word state
  const getClassName = () => {
    if (isKnown || isIgnored) {
      return 'sentence-item'; // No highlighting for known/ignored words
    }
    return `sentence-item ${isClicked || isLingQ ? 'yellow-word' : 'blue-word'}`;
  };

  return (
    <span
      id={word.id}
      className={getClassName()}
      onMouseDown={event => {
        if (isKnown || isIgnored) return;
        event.preventDefault();
        onPointerDown(word.id);
      }}
      onMouseEnter={() => {
        if (isKnown || isIgnored) return;
        onPointerEnter(word.id);
      }}
      onMouseUp={() => {
        if (isKnown || isIgnored) return;
        onPointerUp();
      }}
      onClick={handleClick}
      style={{ cursor: isKnown || isIgnored ? 'default' : 'pointer' }}
    >
      {word.text}
    </span>
  );
};
