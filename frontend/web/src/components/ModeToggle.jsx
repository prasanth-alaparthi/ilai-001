import React from 'react';
import { useDualMode } from '../hooks/useDualMode';
import { Link } from 'react-router-dom';
import './ModeToggle.css';

/**
 * Mode Toggle Component
 * Switches between Free and AI mode
 */
const ModeToggle = ({ compact = false }) => {
  const { isAIMode, canUseAI, toggleMode, modeLabel } = useDualMode();
  
  const handleToggle = () => {
    const switched = toggleMode();
    if (!switched && !canUseAI) {
      // Could show a modal here prompting upgrade
    }
  };
  
  if (compact) {
    return (
      <button
        className={`mode-toggle-compact ${isAIMode ? 'ai-mode' : 'free-mode'}`}
        onClick={handleToggle}
        title={isAIMode ? 'Switch to Free Mode' : 'Switch to AI Mode'}
      >
        {isAIMode ? '✨' : '🔍'}
      </button>
    );
  }
  
  return (
    <div className="mode-toggle">
      <button
        className={`mode-toggle-btn ${isAIMode ? 'ai-mode' : 'free-mode'}`}
        onClick={handleToggle}
        disabled={!isAIMode && !canUseAI}
      >
        <span className="mode-icon">{isAIMode ? '✨' : '🔍'}</span>
        <span className="mode-label">{modeLabel}</span>
      </button>
      
      {!canUseAI && (
        <Link to="/pricing" className="upgrade-hint">
          Upgrade for AI
        </Link>
      )}
    </div>
  );
};

export default ModeToggle;
