# @blocktopus/mcp-server-alert

[![npm version](https://badge.fury.io/js/@blocktopus%2Fmcp-server-alert.svg)](https://badge.fury.io/js/@blocktopus%2Fmcp-server-alert)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that enables AI assistants to generate alerts, sounds, tones, melodies, and sound effects. Perfect for creating audio notifications, alerts, and musical sequences directly from your AI assistant!

## 🎵 Features

- **Play Tones**: Generate pure tones with customizable frequency, duration, and waveform
- **Play Melodies**: Create sequences of musical notes with tempo control
- **Play Chords**: Play multiple notes simultaneously
- **Sound Effects**: Generate common sound effects (beep, alert, notification, error, success)
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Easy Integration**: Simple MCP server that works with Claude Desktop and other MCP clients

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @blocktopus/mcp-server-alert
```

### Or use directly with npx:

```bash
npx @blocktopus/mcp-server-alert
```

## ⚙️ Configuration

### Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sound": {
      "command": "npx",
      "args": ["-y", "@blocktopus/mcp-server-alert"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "sound": {
      "command": "npx",
      "args": ["@blocktopus/mcp-server-alert"]
    }
  }
}
```

## 🛠️ Available Tools

### 1. `play_tone`
Play a simple tone with specified parameters.

**Parameters:**
- `frequency` (number): Frequency in Hz (20-20000)
- `duration` (number): Duration in seconds (0.1-10)
- `waveform` (string): Waveform type ("sine", "square", "sawtooth", "triangle")

**Example:**
```
"Play a 440Hz sine wave for 1 second"
```

### 2. `play_melody`
Play a sequence of musical notes.

**Parameters:**
- `notes` (array): Array of note objects with:
  - `note` (string): Musical note (e.g., "C4", "A#3", "Bb5")
  - `duration` (string): Duration (e.g., "8n", "4n", "2n", "1n")
- `tempo` (number): Tempo in BPM (40-300)

**Example:**
```
"Play the C major scale at 120 BPM"
```

### 3. `play_chord`
Play multiple notes simultaneously.

**Parameters:**
- `notes` (array): Array of note strings (e.g., ["C4", "E4", "G4"])
- `duration` (string): Duration (e.g., "8n", "4n", "2n", "1n")

**Example:**
```
"Play a C major chord"
```

### 4. `generate_sound_effect`
Generate common sound effects.

**Parameters:**
- `type` (string): Type of sound effect ("beep", "alert", "notification", "error", "success")
- `variant` (number): Variant of the sound effect (1-3)

**Example:**
```
"Play a success sound effect"
```

## 💻 Platform Support

The server supports audio playback on:
- **Windows**: Uses PowerShell's Media.SoundPlayer
- **macOS**: Uses afplay
- **Linux**: Uses aplay (requires ALSA)

## 🚀 Development

### Setup
```bash
# Clone the repository
git clone https://github.com/blocktopus/mcp-server-alert.git
cd mcp-server-alert

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

### Project Structure
```
mcp-server-alert/
├── src/
│   └── index.ts      # Main server implementation
├── package.json      # Package configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## 📝 License

MIT © Blocktopus

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔮 Future Features

- [ ] Add support for more audio formats
- [ ] Implement MIDI support
- [ ] Add drum patterns and rhythms
- [ ] Support for audio file playback
- [ ] Add reverb and other effects
- [ ] Implement real-time synthesis with Tone.js
- [ ] WebSocket support for remote control
- [ ] Volume control

## 🐛 Issues

If you encounter any problems, please [file an issue](https://github.com/blocktopus/mcp-server-alert/issues) along with a detailed description.

## 🌟 Support

If you find this project useful, please consider giving it a star on GitHub!
