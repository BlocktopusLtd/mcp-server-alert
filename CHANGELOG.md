# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-02-07

### Fixed
- Windows WAV file playback now uses system default player
- Improved compatibility with non-standard WAV files
- Added Windows Media Player fallback for better WAV format support

### Changed
- External WAV playback now uses `start` command on Windows for better reliability

## [1.0.0] - 2025-01-XX

### Added
- Support for playing external WAV files
- Bundled notification sounds
- List available sounds functionality

## [0.1.0] - 2024-12-XX

### Added
- Initial release
- Play tones with customizable frequency, duration, and waveform
- Play melodies with tempo control
- Play chords (multiple notes simultaneously)
- Generate sound effects (beep, alert, notification, error, success)
- Cross-platform support (Windows, macOS, Linux)
- TypeScript implementation
- MCP server implementation with stdio transport
