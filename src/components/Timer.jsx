import { useEffect, useState } from 'react';

function Timer({
  isRunning,
  isWorkPeriod,
  remainingSeconds,
  completedPomodoros,
  onStart,
  onPause,
  onReset,
  onSwitchPeriod,
  onOpenSettings
}) {
  const [progress, setProgress] = useState(100);

  // Calculate the progress percentage for the circular timer
  useEffect(() => {
    // We need to calculate totalSeconds based on the parent component's values
    let totalSeconds;
    if (isWorkPeriod) {
      // For work periods, use the initial value as the total
      const initialWorkSeconds = completedPomodoros === 0 ? remainingSeconds : remainingSeconds; 
      totalSeconds = initialWorkSeconds > 0 ? initialWorkSeconds : 25 * 60; // Fallback to 25 minutes
    } else {
      // For break periods
      const initialBreakSeconds = remainingSeconds;
      totalSeconds = initialBreakSeconds > 0 ? initialBreakSeconds : 5 * 60; // Fallback to 5 minutes
    }
    
    const calculatedProgress = (remainingSeconds / totalSeconds) * 100;
    setProgress(Math.min(100, Math.max(0, calculatedProgress))); // Ensure between 0-100
  }, [remainingSeconds, isWorkPeriod, completedPomodoros]);

  // Format the remaining time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate the SVG properties for the circular progress indicator
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="timer-container">
      <div className="timer-status">
        <h2>{isWorkPeriod ? 'Work Time' : 'Break Time'}</h2>
        <div className="pomodoro-count">
          Completed Pomodoros: {completedPomodoros}
        </div>
      </div>

      <div className="timer-circle">
        <svg width="230" height="230" viewBox="0 0 230 230">
          {/* Background circle */}
          <circle
            cx="115"
            cy="115"
            r={radius}
            fill="transparent"
            stroke="#e6e6e6"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="115"
            cy="115"
            r={radius}
            fill="transparent"
            stroke={isWorkPeriod ? '#FF6347' : '#4CAF50'}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 115 115)"
          />
          {/* Timer text */}
          <text
            x="115"
            y="115"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="36"
            fontWeight="bold"
            fill={isWorkPeriod ? '#FF6347' : '#4CAF50'}
          >
            {formatTime(remainingSeconds)}
          </text>
        </svg>
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button 
            className="start-button" 
            onClick={onStart}
          >
            Start
          </button>
        ) : (
          <button 
            className="pause-button" 
            onClick={onPause}
          >
            Pause
          </button>
        )}
        
        <button 
          className="reset-button" 
          onClick={onReset}
        >
          Reset
        </button>
        
        <button 
          className="switch-button" 
          onClick={onSwitchPeriod}
        >
          {isWorkPeriod ? 'Skip to Break' : 'Skip to Work'}
        </button>
      </div>
      
      <button 
        className="settings-button" 
        onClick={onOpenSettings}
      >
        ⚙️ Settings
      </button>
    </div>
  );
}

export default Timer;