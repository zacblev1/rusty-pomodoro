// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{State, Window, Manager};
use std::time::{Duration, Instant};
use std::thread;

// Define our timer state
struct TimerState {
    start_time: Option<Instant>,
    duration: Duration,
    is_running: bool,
    is_work_period: bool,
    work_duration: Duration,
    break_duration: Duration,
    completed_pomodoros: usize,
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            start_time: None,
            duration: Duration::from_secs(25 * 60), // Default 25 minutes
            is_running: false,
            is_work_period: true,
            work_duration: Duration::from_secs(25 * 60), // 25 minutes
            break_duration: Duration::from_secs(5 * 60),  // 5 minutes
            completed_pomodoros: 0,
        }
    }
}

// Safely wrap our state with a mutex for thread safety
struct AppState(Mutex<TimerState>);

// Timer control commands
#[tauri::command]
fn start_timer(state: State<AppState>, window: Window) -> Result<(), String> {
    let mut timer_state = state.0.lock().unwrap();
    
    if !timer_state.is_running {
        timer_state.start_time = Some(Instant::now());
        timer_state.is_running = true;

        // Clone the window handle for use in the thread
        let window_clone = window.clone();
        
        // Spawn a thread to track timer progress
        thread::spawn(move || {
            let emit_interval = Duration::from_secs(1);
            let mut last_emit = Instant::now();
            
            loop {
                let state = window_clone.state::<AppState>();
                let timer_state = state.0.lock().unwrap();
                
                if !timer_state.is_running {
                    break;
                }
                
                if let Some(start_time) = timer_state.start_time {
                    let elapsed = start_time.elapsed();
                    
                    // Emit time updates every second
                    if last_emit.elapsed() >= emit_interval {
                        let remaining = if elapsed < timer_state.duration {
                            timer_state.duration - elapsed
                        } else {
                            Duration::from_secs(0)
                        };
                        
                        // Send the time update to the frontend
                        let _ = window_clone.emit("timer-update", remaining.as_secs());
                        
                        // Check if timer has completed
                        if elapsed >= timer_state.duration {
                            drop(timer_state); // Release lock before calling next function
                            
                            // Switch to next period (work -> break or break -> work)
                            let _ = window_clone.emit("period-complete", ());
                            let _ = switch_period(window_clone.state::<AppState>(), window_clone.clone());
                            break;
                        }
                        
                        last_emit = Instant::now();
                    }
                }
                
                drop(timer_state);
                thread::sleep(Duration::from_millis(100));
            }
        });
    }
    
    Ok(())
}

#[tauri::command]
fn pause_timer(state: State<AppState>) -> Result<(), String> {
    let mut timer_state = state.0.lock().unwrap();
    
    if timer_state.is_running {
        if let Some(start_time) = timer_state.start_time {
            let elapsed = start_time.elapsed();
            
            // Adjust the duration to the remaining time
            if elapsed < timer_state.duration {
                timer_state.duration -= elapsed;
            } else {
                timer_state.duration = Duration::from_secs(0);
            }
            
            timer_state.start_time = None;
            timer_state.is_running = false;
        }
    }
    
    Ok(())
}

#[tauri::command]
fn reset_timer(state: State<AppState>, to_work_period: bool) -> Result<(), String> {
    let mut timer_state = state.0.lock().unwrap();
    
    // Reset timer to initial state
    timer_state.start_time = None;
    timer_state.is_running = false;
    
    // Set to work or break period as requested
    timer_state.is_work_period = to_work_period;
    timer_state.duration = if to_work_period {
        timer_state.work_duration
    } else {
        timer_state.break_duration
    };
    
    Ok(())
}

#[tauri::command]
fn switch_period(state: State<AppState>, window: Window) -> Result<(), String> {
    let mut timer_state = state.0.lock().unwrap();
    
    // Toggle between work and break
    timer_state.is_work_period = !timer_state.is_work_period;
    
    // If just completed a work period, increment the counter
    if !timer_state.is_work_period {
        timer_state.completed_pomodoros += 1;
        
        // Emit an event to the frontend
        let _ = window.emit("pomodoro-completed", timer_state.completed_pomodoros);
    }
    
    // Set the appropriate duration
    timer_state.duration = if timer_state.is_work_period {
        timer_state.work_duration
    } else {
        timer_state.break_duration
    };
    
    // Reset the timer
    timer_state.start_time = None;
    timer_state.is_running = false;
    
    // Notify the frontend of the period change
    let _ = window.emit("period-changed", timer_state.is_work_period);
    
    Ok(())
}

#[tauri::command]
fn update_settings(
    state: State<AppState>,
    work_minutes: u64,
    break_minutes: u64
) -> Result<(), String> {
    let mut timer_state = state.0.lock().unwrap();
    
    // Update duration settings
    timer_state.work_duration = Duration::from_secs(work_minutes * 60);
    timer_state.break_duration = Duration::from_secs(break_minutes * 60);
    
    // Update current duration if not running
    if !timer_state.is_running {
        timer_state.duration = if timer_state.is_work_period {
            timer_state.work_duration
        } else {
            timer_state.break_duration
        };
    }
    
    Ok(())
}

#[tauri::command]
fn get_timer_state(state: State<AppState>) -> Result<TimerStateResponse, String> {
    let timer_state = state.0.lock().unwrap();
    
    let remaining_seconds = if let Some(start_time) = timer_state.start_time {
        let elapsed = start_time.elapsed();
        if elapsed < timer_state.duration {
            (timer_state.duration - elapsed).as_secs()
        } else {
            0
        }
    } else {
        timer_state.duration.as_secs()
    };
    
    Ok(TimerStateResponse {
        is_running: timer_state.is_running,
        is_work_period: timer_state.is_work_period,
        remaining_seconds,
        work_duration_minutes: timer_state.work_duration.as_secs() / 60,
        break_duration_minutes: timer_state.break_duration.as_secs() / 60,
        completed_pomodoros: timer_state.completed_pomodoros,
    })
}

// Response struct for the timer state
#[derive(serde::Serialize)]
struct TimerStateResponse {
    is_running: bool,
    is_work_period: bool,
    remaining_seconds: u64,
    work_duration_minutes: u64,
    break_duration_minutes: u64,
    completed_pomodoros: usize,
}

fn main() {
    tauri::Builder::default()
        .manage(AppState(Mutex::new(TimerState::default())))
        .invoke_handler(tauri::generate_handler![
            start_timer,
            pause_timer, 
            reset_timer,
            switch_period,
            update_settings,
            get_timer_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}