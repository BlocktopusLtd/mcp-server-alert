# Troubleshooting Guide

## Windows Configuration

### Using npx.cmd with Full Path

If you're having issues with npx on Windows, you can use the full path to `npx.cmd`. Here are common locations:

1. **Default Node.js installation**:
   ```json
   {
     "mcpServers": {
       "sound": {
         "command": "C:\\Program Files\\nodejs\\npx.cmd",
         "args": ["-y", "@blocktopus/mcp-server-alert"]
       }
     }
   }
   ```

2. **Node.js installed via nvm-windows**:
   ```json
   {
     "mcpServers": {
       "sound": {
         "command": "C:\\Users\\%USERNAME%\\AppData\\Roaming\\nvm\\v20.11.0\\npx.cmd",
         "args": ["-y", "@blocktopus/mcp-server-alert"]
       }
     }
   }
   ```

3. **Node.js installed via Chocolatey**:
   ```json
   {
     "mcpServers": {
       "sound": {
         "command": "C:\\ProgramData\\chocolatey\\bin\\npx.cmd",
         "args": ["-y", "@blocktopus/mcp-server-alert"]
       }
     }
   }
   ```

### Finding Your npx.cmd Location

To find where npx.cmd is installed on your system:

1. Open Command Prompt or PowerShell
2. Run: `where npx`
3. Use the path that ends with `npx.cmd`

### Common Issues

#### "Command not found" or "Cannot find npx"

**Solution**: Use the full path to npx.cmd as shown above.

#### "Access denied" or permission errors

**Solution**: 
1. Run Claude Desktop as Administrator (once to test)
2. Check that your Node.js installation directory has proper permissions
3. Try installing the package globally first: `npm install -g @blocktopus/mcp-server-alert`

#### Audio doesn't play on Windows

**Solution**:
1. Ensure Windows Media Player is installed (required for PowerShell audio playback)
2. Check Windows sound settings and default audio device
3. Try running this test command in PowerShell:
   ```powershell
   (New-Object Media.SoundPlayer "C:\Windows\Media\Windows Ding.wav").PlaySync()
   ```

#### "Module not found" errors

**Solution**:
1. Clear npm cache: `npm cache clean --force`
2. Reinstall: `npm install -g @blocktopus/mcp-server-alert`

## macOS/Linux Configuration

### Audio Issues on Linux

If audio doesn't play on Linux, ensure ALSA is installed:

```bash
# Ubuntu/Debian
sudo apt-get install alsa-utils

# Fedora
sudo dnf install alsa-utils

# Arch
sudo pacman -S alsa-utils
```

### Permission Issues on macOS

If you get permission errors with afplay:
1. Check System Preferences > Security & Privacy > Privacy > Microphone
2. Ensure Terminal/Claude Desktop has necessary permissions

## General Debugging

### Enable Debug Logging

You can see what's happening by checking the MCP logs:

1. **Windows**: Check `%APPDATA%\Claude\logs\`
2. **macOS**: Check `~/Library/Logs/Claude/`
3. **Linux**: Check `~/.config/Claude/logs/`

### Test the Server Directly

To test if the server works outside of Claude:

```bash
# Install globally
npm install -g @blocktopus/mcp-server-alert

# Run directly (should show "MCP Alert Server running on stdio")
mcp-server-alert
```

### Report Issues

If you're still having problems:
1. Check existing issues: https://github.com/blocktopus/mcp-server-alert/issues
2. Create a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Error messages or logs
   - Your configuration file
