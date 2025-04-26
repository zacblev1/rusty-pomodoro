import { useState } from 'react';

function Settings({
  workDurationMinutes,
  breakDurationMinutes,
  onSave,
  onCancel
}) {
  const [workMinutes, setWorkMinutes] = useState(workDurationMinutes);
  const [breakMinutes, setBreakMinutes] = useState(breakDurationMinutes);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(workMinutes, breakMinutes);
  };
  
  return (
    <div className="settings-container">
      <h2>Timer Settings</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="workDuration">Work Duration (minutes):</label>
          <input
            type="number"
            id="workDuration"
            value={workMinutes}
            onChange={(e) => setWorkMinutes(parseInt(e.target.value, 10) || 1)}
            min="1"
            max="60"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="breakDuration">Break Duration (minutes):</label>
          <input
            type="number"
            id="breakDuration"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10) || 1)}
            min="1"
            max="30"
            required
          />
        </div>
        
        <div className="button-group">
          <button type="submit" className="save-button">
            Save Settings
          </button>
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;