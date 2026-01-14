import React from 'react';
import type { Word as WordType } from '../data/lesson';
import './Word.css';

interface WordProps {
  word: WordType;
  isClicked: boolean;
  onClick: (wordId: string) => void;
  isKnown: boolean;
  isIgnored: boolean;
}

export const Word: React.FC<WordProps> = ({ word, isClicked, onClick, isKnown, isIgnored }) => {
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
    return `sentence-item ${isClicked ? 'yellow-word' : 'blue-word'}`;
  };

  return (
    <span
      id={word.id}
      className={getClassName()}
      onClick={handleClick}
      style={{ cursor: isKnown || isIgnored ? 'default' : 'pointer' }}
    >
      {word.text}
    </span>
  );
};
