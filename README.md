# Rusty Pomodoro - A Graphical Pomodoro Timer in Rust

This project creates a graphical Pomodoro timer application using Rust and Tauri. The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.

## Features

- Custom work and break durations
- Visual circular progress indicator
- Desktop notifications when periods end
- Pomodoro count tracking
- Ability to pause, reset, and switch between work and break periods
- Clean, modern UI

## Setup Instructions

1. Install Rust and Cargo if you haven't already:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install Node.js and npm (if not already installed)

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

## Building for Production

To build the application for production:

```bash
npm run tauri build
```

## Project Structure

```
rusty-pomodoro/
├── src-tauri/            # Rust backend
│   ├── src/
│   │   └── main.rs       # Rust backend code
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
└── src/                  # Frontend
    ├── assets/           # Static assets
    │   ├── app.css       # Styling
    │   └── sounds/       # Sound files
    ├── components/       # React components
    │   ├── Timer.jsx     # Timer component
    │   └── Settings.jsx  # Settings component
    ├── App.jsx           # Main React component
    ├── index.html        # HTML entry point
    └── main.js           # JavaScript entry point
```

## Customization

You can customize the application further by:
- Adding sound alerts for period transitions
- Implementing a long break after a certain number of Pomodoros
- Creating custom themes
- Adding statistics tracking for completed Pomodoros

## License

MIT