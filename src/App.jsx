import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
import Timer from './components/Timer';
import Settings from './components/Settings';

function App() {
  const [timerState, setTimerState] = useState({
    isRunning: false,
    isWorkPeriod: true,
    remainingSeconds: 25 * 60,
    workDurationMinutes: 25,
    breakDurationMinutes: 5,
    completedPomodoros: 0
  });
  
  const [showSettings, setShowSettings] = useState(false);

  // Initialize the timer state from the backend
  useEffect(() => {
    getTimerState();
    
    // Set up listeners for timer events
    const unlistenTimerUpdate = listen('timer-update', (event) => {
      setTimerState(prev => ({
        ...prev,
        remainingSeconds: event.payload
      }));
    });
    
    const unlistenPeriodComplete = listen('period-complete', async () => {
      const permissionGranted = await checkNotificationPermission();
      
      if (permissionGranted) {
        sendNotification({
          title: timerState.isWorkPeriod ? 'Break Time!' : 'Work Time!',
          body: timerState.isWorkPeriod 
            ? 'Great job! Take a break.' 
            : 'Break is over. Let\'s get back to work!'
        });
      }
    });
    
    const unlistenPeriodChanged = listen('period-changed', (event) => {
      setTimerState(prev => ({
        ...prev,
        isWorkPeriod: event.payload,
        isRunning: false,
        remainingSeconds: event.payload ? 
          prev.workDurationMinutes * 60 : 
          prev.breakDurationMinutes * 60
      }));
    });
    
    const unlistenPomodoroDone = listen('pomodoro-completed', (event) => {
      setTimerState(prev => ({
        ...prev,
        completedPomodoros: event.payload
      }));
    });
    
    // Cleanup listeners on component unmount
    return () => {
      unlistenTimerUpdate.then(fn => fn());
      unlistenPeriodComplete.then(fn => fn());
      unlistenPeriodChanged.then(fn => fn());
      unlistenPomodoroDone.then(fn => fn());
    };
  }, []);
  
  // Check and request notification permissions
  async function checkNotificationPermission() {
    let permissionGranted = await isPermissionGranted();
    
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    
    return permissionGranted;
  }
  
  // Get timer state from the backend
  async function getTimerState() {
    try {
      const state = await invoke('get_timer_state');
      setTimerState({
        isRunning: state.is_running,
        isWorkPeriod: state.is_work_period,
        remainingSeconds: state.remaining_seconds,
        workDurationMinutes: state.work_duration_minutes,
        breakDurationMinutes: state.break_duration_minutes,
        completedPomodoros: state.completed_pomodoros
      });
    } catch (error) {
      console.error('Failed to get timer state:', error);
    }
  }
  
  // Timer control functions
  async function startTimer() {
    try {
      await invoke('start_timer');
      setTimerState(prev => ({ ...prev, isRunning: true }));
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  }
  
  async function pauseTimer() {
    try {
      await invoke('pause_timer');
      setTimerState(prev => ({ ...prev, isRunning: false }));
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }
  
  async function resetTimer() {
    try {
      await invoke('reset_timer', { toWorkPeriod: timerState.isWorkPeriod });
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        remainingSeconds: prev.isWorkPeriod ? 
          prev.workDurationMinutes * 60 : 
          prev.breakDurationMinutes * 60
      }));
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  }
  
  async function switchPeriod() {
    try {
      await invoke('switch_period');
      // The state will be updated via the event listener
    } catch (error) {
      console.error('Failed to switch period:', error);
    }
  }
  
  // Update timer settings
  async function updateSettings(workMinutes, breakMinutes) {
    try {
      await invoke('update_settings', {
        workMinutes,
        breakMinutes
      });
      
      setTimerState(prev => ({
        ...prev,
        workDurationMinutes: workMinutes,
        breakDurationMinutes: breakMinutes,
        remainingSeconds: prev.isWorkPeriod ? 
          workMinutes * 60 : 
          breakMinutes * 60
      }));
      
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }

  return (
    <div className="container">
      <h1>Rusty Pomodoro</h1>
      
      {!showSettings ? (
        <Timer 
          isRunning={timerState.isRunning}
          isWorkPeriod={timerState.isWorkPeriod}
          remainingSeconds={timerState.remainingSeconds}
          completedPomodoros={timerState.completedPomodoros}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          onSwitchPeriod={switchPeriod}
          onOpenSettings={() => setShowSettings(true)}
        />
      ) : (
        <Settings 
          workDurationMinutes={timerState.workDurationMinutes}
          breakDurationMinutes={timerState.breakDurationMinutes}
          onSave={updateSettings}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;