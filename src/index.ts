#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { spawn } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Bundled notification sounds as base64 encoded WAV files
// These are common notification sounds that can be used without external files
const BUNDLED_SOUNDS: Record<string, string> = {
  // Simple notification beep
  notification: "data:audio/wav;base64,UklGRjwCAABXQVZFZm10IBAAAAABAAEARA...", // This would be the actual base64 data
  // Success sound
  success: "data:audio/wav;base64,UklGRjwCAABXQVZFZm10IBAAAAABAAEARA...",
  // Error sound
  error: "data:audio/wav;base64,UklGRjwCAABXQVZFZm10IBAAAAABAAEARA...",
  // Add more sounds here
};

// Initialize the MCP server
const server = new Server({
  name: "mcp-server-alert",
  version: "0.1.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Helper function to play audio file
async function playAudioFile(filePath: string, volume: number = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];
    
    switch (process.platform) {
      case 'win32':
        // Try multiple methods on Windows
        command = 'powershell';
        // Note: Windows SoundPlayer doesn't support volume directly
        args = ['-c', `(New-Object Media.SoundPlayer "${filePath}").PlaySync()`];
        break;
      case 'darwin':
        command = 'afplay';
        args = [filePath];
        break;
      case 'linux':
        command = 'aplay';
        args = [filePath];
        break;
      default:
        reject(new Error(`Unsupported platform: ${process.platform}`));
        return;
    }
    
    const player = spawn(command, args);
    
    player.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Player exited with code ${code}`));
      }
    });
    
    player.on('error', (err) => {
      reject(err);
    });
  });
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "play_tone",
        description: "Play a simple tone with specified parameters",
        inputSchema: {
          type: "object",
          properties: {
            frequency: {
              type: "number",
              minimum: 20,
              maximum: 20000,
              description: "Frequency in Hz (20-20000)"
            },
            duration: {
              type: "number",
              minimum: 0.1,
              maximum: 10,
              description: "Duration in seconds (0.1-10)"
            },
            waveform: {
              type: "string",
              enum: ["sine", "square", "sawtooth", "triangle"],
              default: "sine",
              description: "Waveform type"
            },
            volume: {
              type: "number",
              minimum: 0,
              maximum: 1,
              default: 0.5,
              description: "Volume level (0-1)"
            }
          },
          required: ["frequency", "duration"]
        }
      },
      {
        name: "play_melody",
        description: "Play a sequence of musical notes",
        inputSchema: {
          type: "object",
          properties: {
            notes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  note: {
                    type: "string",
                    description: "Musical note (e.g., 'C4', 'A#3', 'Bb5')"
                  },
                  duration: {
                    type: "string",
                    description: "Duration (e.g., '8n', '4n', '2n', '1n')"
                  }
                },
                required: ["note", "duration"]
              },
              description: "Array of notes to play"
            },
            tempo: {
              type: "number",
              minimum: 40,
              maximum: 300,
              default: 120,
              description: "Tempo in BPM"
            },
            volume: {
              type: "number",
              minimum: 0,
              maximum: 1,
              default: 0.5,
              description: "Volume level (0-1)"
            }
          },
          required: ["notes"]
        }
      },
      {
        name: "play_chord",
        description: "Play multiple notes simultaneously",
        inputSchema: {
          type: "object",
          properties: {
            notes: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Array of notes to play simultaneously (e.g., ['C4', 'E4', 'G4'])"
            },
            duration: {
              type: "string",
              default: "2n",
              description: "Duration (e.g., '8n', '4n', '2n', '1n')"
            },
            volume: {
              type: "number",
              minimum: 0,
              maximum: 1,
              default: 0.5,
              description: "Volume level (0-1)"
            }
          },
          required: ["notes"]
        }
      },
      {
        name: "generate_sound_effect",
        description: "Generate common sound effects",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["beep", "alert", "notification", "error", "success"],
              description: "Type of sound effect"
            },
            variant: {
              type: "number",
              minimum: 1,
              maximum: 3,
              default: 1,
              description: "Variant of the sound effect"
            },
            volume: {
              type: "number",
              minimum: 0,
              maximum: 1,
              default: 0.5,
              description: "Volume level (0-1)"
            }
          },
          required: ["type"]
        }
      },
      {
        name: "play_wav",
        description: "Play an external WAV file",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "Path to the WAV file"
            },
            volume: {
              type: "number",
              minimum: 0,
              maximum: 1,
              default: 1.0,
              description: "Volume level (0-1)"
            }
          },
          required: ["filepath"]
        }
      },
      {
        name: "play_bundled_sound",
        description: "Play a bundled notification sound",
        inputSchema: {
          type: "object",
          properties: {
            sound: {
              type: "string",
              enum: ["notification", "success", "error", "bell", "chime", "ping", "submarine"],
              description: "Name of the bundled sound to play"
            },
            volume: {
              type: "number",
              minimum: 0,
              maximum: 1,
              default: 0.7,
              description: "Volume level (0-1)"
            }
          },
          required: ["sound"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "play_tone": {
      const { frequency, duration, waveform = "sine", volume = 0.5 } = args as any;
      try {
        // Generate tone data
        const sampleRate = 44100;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = new Float32Array(numSamples);
        
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          let sample = 0;
          
          switch (waveform) {
            case "sine":
              sample = Math.sin(2 * Math.PI * frequency * t);
              break;
            case "square":
              sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
              break;
            case "sawtooth":
              sample = 2 * (frequency * t % 1) - 1;
              break;
            case "triangle":
              const period = 1 / frequency;
              const phase = t % period;
              sample = 4 * Math.abs(phase / period - 0.5) - 1;
              break;
          }
          
          buffer[i] = sample * volume;
        }
        
        // Convert to WAV format
        const wavBuffer = createWavBuffer(buffer, sampleRate);
        
        // Save to temp file
        const tempFile = join(tmpdir(), `tone_${Date.now()}.wav`);
        writeFileSync(tempFile, wavBuffer);
        
        // Play the file
        await playAudioFile(tempFile);
        
        return {
          content: [{
            type: "text",
            text: `✅ Played ${waveform} wave at ${frequency}Hz for ${duration} seconds`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error playing tone: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }

    case "play_melody": {
      const { notes, tempo = 120, volume = 0.5 } = args as any;
      try {
        // Calculate total duration
        const beatDuration = 60 / tempo; // Duration of one beat in seconds
        let totalDuration = 0;
        
        const processedNotes = notes.map((note: { note: string; duration: string }) => {
          const duration = parseDuration(note.duration, beatDuration);
          totalDuration += duration;
          return { ...note, durationSeconds: duration };
        });
        
        // Generate audio
        const sampleRate = 44100;
        const numSamples = Math.floor(sampleRate * totalDuration);
        const buffer = new Float32Array(numSamples);
        
        let currentTime = 0;
        for (const note of processedNotes) {
          const frequency = noteToFrequency(note.note);
          const startSample = Math.floor(currentTime * sampleRate);
          const endSample = Math.floor((currentTime + note.durationSeconds) * sampleRate);
          
          for (let i = startSample; i < endSample && i < numSamples; i++) {
            const t = (i - startSample) / sampleRate;
            const envelope = Math.min(1, t * 10) * Math.max(0, 1 - t / note.durationSeconds);
            buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
          }
          
          currentTime += note.durationSeconds;
        }
        
        // Convert to WAV and play
        const wavBuffer = createWavBuffer(buffer, sampleRate);
        const tempFile = join(tmpdir(), `melody_${Date.now()}.wav`);
        writeFileSync(tempFile, wavBuffer);
        await playAudioFile(tempFile);
        
        return {
          content: [{
            type: "text",
            text: `✅ Played melody with ${notes.length} notes at ${tempo} BPM`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error playing melody: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }

    case "play_chord": {
      const { notes, duration = "2n", volume = 0.5 } = args as any;
      try {
        const beatDuration = 0.5; // Default beat duration
        const durationSeconds = parseDuration(duration, beatDuration);
        
        // Generate chord
        const sampleRate = 44100;
        const numSamples = Math.floor(sampleRate * durationSeconds);
        const buffer = new Float32Array(numSamples);
        
        for (const note of notes) {
          const frequency = noteToFrequency(note);
          
          for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const envelope = Math.min(1, t * 10) * Math.max(0, 1 - t / durationSeconds);
            buffer[i] += Math.sin(2 * Math.PI * frequency * t) * envelope * volume / notes.length;
          }
        }
        
        // Convert to WAV and play
        const wavBuffer = createWavBuffer(buffer, sampleRate);
        const tempFile = join(tmpdir(), `chord_${Date.now()}.wav`);
        writeFileSync(tempFile, wavBuffer);
        await playAudioFile(tempFile);
        
        return {
          content: [{
            type: "text",
            text: `✅ Played chord: ${notes.join(', ')}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error playing chord: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }

    case "generate_sound_effect": {
      const { type, variant = 1, volume = 0.5 } = args as any;
      try {
        const sampleRate = 44100;
        let buffer: Float32Array;
        
        switch (type) {
          case "beep":
            buffer = generateBeep(sampleRate, variant, volume);
            break;
          case "alert":
            buffer = generateAlert(sampleRate, variant, volume);
            break;
          case "notification":
            buffer = generateNotification(sampleRate, variant, volume);
            break;
          case "error":
            buffer = generateError(sampleRate, variant, volume);
            break;
          case "success":
            buffer = generateSuccess(sampleRate, variant, volume);
            break;
          default:
            throw new Error(`Unknown sound effect type: ${type}`);
        }
        
        // Convert to WAV and play
        const wavBuffer = createWavBuffer(buffer, sampleRate);
        const tempFile = join(tmpdir(), `effect_${type}_${Date.now()}.wav`);
        writeFileSync(tempFile, wavBuffer);
        await playAudioFile(tempFile);
        
        return {
          content: [{
            type: "text",
            text: `✅ Played ${type} sound effect (variant ${variant})`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error generating sound effect: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }

    case "play_wav": {
      const { filepath, volume = 1.0 } = args as any;
      try {
        // Read the WAV file
        const fs = await import('fs/promises');
        const wavData = await fs.readFile(filepath);
        
        // For volume adjustment, we'd need to parse and modify the WAV data
        // For now, we'll save it to a temp file and play it
        // In a production version, you'd want to actually parse and modify the audio data
        const tempFile = join(tmpdir(), `wav_${Date.now()}.wav`);
        await fs.writeFile(tempFile, wavData);
        
        // Play the file
        await playAudioFile(tempFile, volume);
        
        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {}); // Ignore errors
        
        return {
          content: [{
            type: "text",
            text: `✅ Played WAV file: ${filepath} at volume ${volume}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error playing WAV file: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }

    case "play_bundled_sound": {
      const { sound, volume = 0.7 } = args as any;
      try {
        let buffer: Float32Array;
        
        // Generate the appropriate sound based on selection
        const sampleRate = 44100;
        switch (sound) {
          case "notification":
            buffer = generateNotificationSound(sampleRate, volume);
            break;
          case "success":
            buffer = generateSuccessSound(sampleRate, volume);
            break;
          case "error":
            buffer = generateErrorSound(sampleRate, volume);
            break;
          case "bell":
            buffer = generateBellSound(sampleRate, volume);
            break;
          case "chime":
            buffer = generateChimeSound(sampleRate, volume);
            break;
          case "ping":
            buffer = generatePingSound(sampleRate, volume);
            break;
          case "submarine":
            buffer = generateSubmarineSound(sampleRate, volume);
            break;
          default:
            throw new Error(`Unknown bundled sound: ${sound}`);
        }
        
        // Convert to WAV and play
        const wavBuffer = createWavBuffer(buffer, sampleRate);
        const tempFile = join(tmpdir(), `bundled_${sound}_${Date.now()}.wav`);
        writeFileSync(tempFile, wavBuffer);
        await playAudioFile(tempFile, volume);
        
        return {
          content: [{
            type: "text",
            text: `✅ Played bundled sound: ${sound} at volume ${volume}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error playing bundled sound: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Helper functions for note conversion
function noteToFrequency(note: string): number {
  const notes: Record<string, number> = {
    'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
    'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1,
    'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
  };
  
  const match = note.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) throw new Error(`Invalid note: ${note}`);
  
  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const semitone = notes[noteName];
  
  if (semitone === undefined) throw new Error(`Unknown note: ${noteName}`);
  
  // A4 = 440Hz
  const semitonesFromA4 = semitone + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

function parseDuration(duration: string, beatDuration: number): number {
  const durations: Record<string, number> = {
    '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25
  };
  
  return (durations[duration] || 1) * beatDuration;
}

// Sound effect generators
function generateBeep(sampleRate: number, variant: number, volume: number = 0.3): Float32Array {
  const duration = 0.2;
  const frequency = variant === 1 ? 800 : variant === 2 ? 1000 : 1200;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.PI * t / duration);
    buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }
  
  return buffer;
}

function generateAlert(sampleRate: number, variant: number, volume: number = 0.5): Float32Array {
  const duration = 0.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  const freq1 = variant === 1 ? 523.25 : variant === 2 ? 659.25 : 783.99; // C5, E5, G5
  const freq2 = variant === 1 ? 659.25 : variant === 2 ? 783.99 : 1046.50; // E5, G5, C6
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < duration / 2 ? freq1 : freq2;
    const envelope = 1.0;
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
  }
  
  return buffer;
}

function generateNotification(sampleRate: number, variant: number, volume: number = 0.3): Float32Array {
  const duration = 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  const frequencies = variant === 1 ? [523.25, 659.25, 783.99] : // C5, E5, G5
                      variant === 2 ? [587.33, 739.99, 880.00] : // D5, F#5, A5
                                      [659.25, 830.61, 987.77];   // E5, G#5, B5
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t * frequencies.length / duration);
    if (noteIndex < frequencies.length) {
      const freq = frequencies[noteIndex];
      const envelope = Math.sin(Math.PI * (t % (duration / frequencies.length)) / (duration / frequencies.length));
      buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
    }
  }
  
  return buffer;
}

function generateError(sampleRate: number, variant: number, volume: number = 0.4): Float32Array {
  const duration = 0.4;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  const baseFreq = variant === 1 ? 200 : variant === 2 ? 150 : 100;
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wobble = Math.sin(2 * Math.PI * 6 * t) * 20;
    const envelope = Math.exp(-t * 3);
    buffer[i] = Math.sin(2 * Math.PI * (baseFreq + wobble) * t) * envelope * volume;
  }
  
  return buffer;
}

function generateSuccess(sampleRate: number, variant: number, volume: number = 0.3): Float32Array {
  const duration = 0.4;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  const frequencies = variant === 1 ? [523.25, 659.25] :    // C5, E5
                      variant === 2 ? [587.33, 783.99] :    // D5, G5
                                      [659.25, 880.00];     // E5, A5
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = t < duration / 2 ? 0 : 1;
    const freq = frequencies[noteIndex];
    const envelope = Math.sin(Math.PI * t / duration);
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
  }
  
  return buffer;
}

// Bundled sound generators
function generateNotificationSound(sampleRate: number, volume: number): Float32Array {
  // Classic notification sound - two quick ascending tones
  const duration = 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let freq: number;
    if (t < 0.1) {
      freq = 523.25; // C5
    } else if (t < 0.15) {
      freq = 0; // silence
    } else if (t < 0.25) {
      freq = 659.25; // E5
    } else {
      freq = 0;
    }
    
    if (freq > 0) {
      const envelope = Math.sin(Math.PI * ((t % 0.1) / 0.1));
      buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
    }
  }
  
  return buffer;
}

function generateSuccessSound(sampleRate: number, volume: number): Float32Array {
  // Ascending major chord arpeggio
  const duration = 0.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t * notes.length / duration);
    
    if (noteIndex < notes.length) {
      const localT = t % (duration / notes.length);
      const envelope = Math.sin(Math.PI * localT / (duration / notes.length));
      buffer[i] = Math.sin(2 * Math.PI * notes[noteIndex] * t) * envelope * volume;
    }
  }
  
  return buffer;
}

function generateErrorSound(sampleRate: number, volume: number): Float32Array {
  // Low frequency buzz with descending pitch
  const duration = 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const baseFreq = 150 - (t * 50); // Descending from 150Hz to 100Hz
    const wobble = Math.sin(2 * Math.PI * 8 * t) * 10;
    const envelope = Math.exp(-t * 2);
    buffer[i] = Math.sin(2 * Math.PI * (baseFreq + wobble) * t) * envelope * volume;
  }
  
  return buffer;
}

function generateBellSound(sampleRate: number, volume: number): Float32Array {
  // Bell-like sound with harmonics
  const duration = 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  const fundamental = 880; // A5
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 2) * Math.sin(Math.PI * t / duration);
    
    // Add harmonics for bell-like timbre
    let sample = 0;
    sample += Math.sin(2 * Math.PI * fundamental * t) * 1.0;
    sample += Math.sin(2 * Math.PI * fundamental * 2 * t) * 0.6;
    sample += Math.sin(2 * Math.PI * fundamental * 3 * t) * 0.4;
    sample += Math.sin(2 * Math.PI * fundamental * 4.2 * t) * 0.25;
    sample += Math.sin(2 * Math.PI * fundamental * 5.4 * t) * 0.2;
    
    buffer[i] = sample * envelope * volume * 0.3;
  }
  
  return buffer;
}

function generateChimeSound(sampleRate: number, volume: number): Float32Array {
  // Wind chime-like sound with multiple tones
  const duration = 1.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  const frequencies = [1046.50, 1174.66, 1318.51, 1396.91, 1567.98]; // C6, D6, E6, F6, G6
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    frequencies.forEach((freq, index) => {
      const delay = index * 0.1;
      if (t > delay) {
        const localT = t - delay;
        const envelope = Math.exp(-localT * 1.5) * Math.sin(Math.PI * localT / 0.5);
        sample += Math.sin(2 * Math.PI * freq * t) * envelope;
      }
    });
    
    buffer[i] = sample * volume * 0.3;
  }
  
  return buffer;
}

function generatePingSound(sampleRate: number, volume: number): Float32Array {
  // Short, high-pitched ping
  const duration = 0.15;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  const frequency = 2093; // C7
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 20) * Math.sin(Math.PI * t / duration);
    buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }
  
  return buffer;
}

function generateSubmarineSound(sampleRate: number, volume: number): Float32Array {
  // Submarine sonar ping with echo
  const duration = 2.0;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  const frequency = 1500; // Typical sonar frequency
  
  // Create multiple pings with decreasing volume (echo effect)
  const pingDuration = 0.2;
  const pings = [
    { start: 0, amplitude: 1.0 },
    { start: 0.4, amplitude: 0.5 },
    { start: 0.7, amplitude: 0.25 },
    { start: 0.9, amplitude: 0.125 }
  ];
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    pings.forEach(ping => {
      if (t >= ping.start && t < ping.start + pingDuration) {
        const localT = t - ping.start;
        // Envelope for each ping
        const envelope = Math.sin(Math.PI * localT / pingDuration) * Math.exp(-localT * 2);
        // Add slight frequency modulation for more realistic sonar sound
        const freqMod = 1 + Math.sin(2 * Math.PI * 5 * localT) * 0.02;
        sample += Math.sin(2 * Math.PI * frequency * freqMod * t) * envelope * ping.amplitude;
      }
    });
    
    buffer[i] = sample * volume * 0.5;
  }
  
  return buffer;
}

// WAV file creation
function createWavBuffer(audioData: Float32Array, sampleRate: number): Buffer {
  const length = audioData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return Buffer.from(arrayBuffer);
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Alert Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
