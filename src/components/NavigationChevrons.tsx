import React from 'react';
import './NavigationChevrons.css';

interface NavigationChevronsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  visible: boolean;
}

export const NavigationChevrons: React.FC<NavigationChevronsProps> = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  visible
}) => {
  return (
    <>
      <button
        className={`nav-chevron nav-chevron-left ${visible ? 'visible' : ''} ${!canGoPrevious ? 'disabled' : ''}`}
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Previous page"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        className={`nav-chevron nav-chevron-right ${visible ? 'visible' : ''} ${!canGoNext ? 'disabled' : ''}`}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  );
};
