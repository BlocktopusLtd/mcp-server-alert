# @blocktopus/mcp-server-alert

[![npm version](https://badge.fury.io/js/@blocktopus%2Fmcp-server-alert.svg)](https://badge.fury.io/js/@blocktopus%2Fmcp-server-alert)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that enables AI assistants to generate alerts, sounds, tones, melodies, and sound effects. Perfect for creating audio notifications, alerts, and musical sequences directly from your AI assistant!

## 🎵 Features

- **Play Tones**: Generate pure tones with customizable frequency, duration, waveform, and volume
- **Play Melodies**: Create sequences of musical notes with tempo and volume control
- **Play Chords**: Play multiple notes simultaneously with volume control
- **Sound Effects**: Generate common sound effects (beep, alert, notification, error, success) with volume control
- **External WAV Files**: Play external WAV files with volume control
- **Bundled Sounds**: Built-in notification sounds (notification, success, error, bell, chime, ping)
- **Sound Discovery**: Automatically discover WAV files from a specified directory
- **Volume Control**: All sounds support volume adjustment (0-1)
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

#### Option 1: Using npx (Downloads latest version on each Claude startup)

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

**With Sound Discovery:**
```json
{
  "mcpServers": {
    "sound": {
      "command": "npx",
      "args": ["-y", "@blocktopus/mcp-server-alert", "C:/MyMedia/Sounds"]
    }
  }
}
```

#### Option 2: Using global install (Faster startup, uses locally installed version)

First install globally:
```bash
npm install -g @blocktopus/mcp-server-alert
```

Then use this configuration:
```json
{
  "mcpServers": {
    "sound": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/@blocktopus/mcp-server-alert/dist/index.js"]
    }
  }
}
```

**With Sound Discovery:**
```json
{
  "mcpServers": {
    "sound": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/@blocktopus/mcp-server-alert/dist/index.js", "C:/MyMedia/Sounds"]
    }
  }
}
```

**Note:** The path to the globally installed module may vary depending on your system:
- **macOS/Linux**: `/usr/local/lib/node_modules/@blocktopus/mcp-server-alert/dist/index.js`
- **Windows**: `%APPDATA%\npm\node_modules\@blocktopus\mcp-server-alert\dist\index.js`
- You can find your global node_modules path by running: `npm root -g`

Replace `C:/MyMedia/Sounds` with the path to your directory containing WAV files. The server will automatically discover all WAV files in that directory and make them available by their filename (without extension).

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
- `volume` (number): Volume level (0-1, default: 0.5)

**Example:**
```
"Play a 440Hz sine wave for 1 second at half volume"
```

### 2. `play_melody`
Play a sequence of musical notes.

**Parameters:**
- `notes` (array): Array of note objects with:
  - `note` (string): Musical note (e.g., "C4", "A#3", "Bb5")
  - `duration` (string): Duration (e.g., "8n", "4n", "2n", "1n")
- `tempo` (number): Tempo in BPM (40-300)
- `volume` (number): Volume level (0-1, default: 0.5)

**Example:**
```
"Play the C major scale at 120 BPM"
```

### 3. `play_chord`
Play multiple notes simultaneously.

**Parameters:**
- `notes` (array): Array of note strings (e.g., ["C4", "E4", "G4"])
- `duration` (string): Duration (e.g., "8n", "4n", "2n", "1n")
- `volume` (number): Volume level (0-1, default: 0.5)

**Example:**
```
"Play a C major chord"
```

### 4. `generate_sound_effect`
Generate common sound effects.

**Parameters:**
- `type` (string): Type of sound effect ("beep", "alert", "notification", "error", "success")
- `variant` (number): Variant of the sound effect (1-3)
- `volume` (number): Volume level (0-1, default: 0.5)

**Example:**
```
"Play a success sound effect"
```

### 5. `play_wav`
Play an external WAV file.

**Parameters:**
- `filepath` (string): Path to the WAV file
- `volume` (number): Volume level (0-1, default: 1.0)

**Example:**
```
"Play the sound file at C:/sounds/alert.wav"
```

### 6. `play_bundled_sound`
Play a bundled notification sound.

**Parameters:**
- `sound` (string): Name of the bundled sound (see list below or use any custom name)
- `volume` (number): Volume level (0-1, default: 0.7)

**Pre-defined Bundled Sounds:**

*Original sounds:*
- `notification`: Classic two-tone notification
- `success`: Ascending major chord arpeggio
- `error`: Low frequency buzz with descending pitch
- `bell`: Bell-like sound with harmonics
- `chime`: Wind chime-like sound
- `ping`: Short, high-pitched ping
- `submarine`: Sonar ping with echo effect

*alert-sound-notify compatible sounds:*
- `bottle`: Bottle blow resonance
- `glass`: High-pitched glass tap
- `funk`: Funky bass wobble
- `morse`: Morse code pattern (dot-dot-dash)
- `purr`: Cat-like purring sound
- `tink`: Light metallic tink

*macOS native notification sounds:*
- `basso`: Deep bass thud
- `blow`: Whistle/blow sound
- `frog`: Frog croak
- `hero`: Heroic fanfare
- `pop`: Pop/bubble sound
- `sosumi`: Classic Mac alert sound

**Custom Sounds:**
You can also pass any custom sound name, and the system will generate a unique sound based on that name. For example: `play_bundled_sound({ sound: "my-custom-alert" })` will generate a consistent sound unique to that name.

**Example:**
```
"Play the bell notification sound"
```

### 7. `list_sounds`
List all available sounds (bundled and discovered).

**Parameters:** None

**Example:**
```
"List all available sounds"
```

This will show:
- Any WAV files discovered from your specified directory
- All bundled sounds available
- A note that custom names can be used to generate unique sounds

## 🔊 Sound Discovery

When you specify a sounds directory in the MCP server configuration, the server will:
1. Scan the directory for all `.wav` files at startup
2. Make them available by their filename (without extension)
3. Prioritize discovered sounds over bundled sounds with the same name

For example, if you have:
- `C:/MyMedia/Sounds/homer-doh.wav`
- `C:/MyMedia/Sounds/notification.wav`

You can play them with:
```
"Play the homer-doh sound"
"Play the notification sound" (will use your file, not the bundled one)
```

## 💻 Platform Support

The server supports audio playback on:
- **Windows**: Uses PowerShell's Media.SoundPlayer with WAV volume adjustment
- **macOS**: Uses afplay with native volume support
- **Linux**: Uses aplay with WAV volume adjustment

Volume control works on all platforms! On Windows and Linux, the WAV data is modified to adjust volume. On macOS, the native -v flag is used.

## 🚀 Development

### Setup
```bash
# Clone the repository
git clone https://github.com/BlocktopusLtd/mcp-server-alert.git
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

- [✓] Add support for volume control
- [✓] Support for external WAV file playback
- [✓] Built-in notification sounds
- [ ] Add support for more audio formats (MP3, OGG)
- [ ] Implement MIDI support
- [ ] Add drum patterns and rhythms
- [ ] Add reverb and other effects
- [ ] Implement real-time synthesis with Tone.js
- [ ] WebSocket support for remote control
- [ ] Audio recording capabilities

## 🐛 Issues & Troubleshooting

If you encounter any problems, please check our [Troubleshooting Guide](TROUBLESHOOTING.md) first.

For unresolved issues, please [file an issue](https://github.com/BlocktopusLtd/mcp-server-alert/issues) along with a detailed description.

## 🌟 Support

If you find this project useful, please consider giving it a star on GitHub!
