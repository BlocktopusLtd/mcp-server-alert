#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as Tone from "tone";
import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Initialize the MCP server
const server = new McpServer({
  name: "mcp-server-alert",
  version: "0.1.0"
});

// Tool schemas
const playToneSchema = z.object({
  frequency: z.number().min(20).max(20000).describe("Frequency in Hz (20-20000)"),
  duration: z.number().min(0.1).max(10).describe("Duration in seconds (0.1-10)"),
  waveform: z.enum(["sine", "square", "sawtooth", "triangle"]).default("sine").describe("Waveform type")
});

const playMelodySchema = z.object({
  notes: z.array(z.object({
    note: z.string().describe("Musical note (e.g., 'C4', 'A#3', 'Bb5')"),
    duration: z.string().describe("Duration (e.g., '8n', '4n', '2n', '1n')")
  })).describe("Array of notes to play"),
  tempo: z.number().min(40).max(300).default(120).describe("Tempo in BPM")
});

const playChordSchema = z.object({
  notes: z.array(z.string()).describe("Array of notes to play simultaneously (e.g., ['C4', 'E4', 'G4'])"),
  duration: z.string().default("2n").describe("Duration (e.g., '8n', '4n', '2n', '1n')")
});

const generateSoundEffectSchema = z.object({
  type: z.enum(["beep", "alert", "notification", "error", "success"]).describe("Type of sound effect"),
  variant: z.number().min(1).max(3).default(1).describe("Variant of the sound effect")
});

// Helper function to play audio file
async function playAudioFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];
    
    switch (process.platform) {
      case 'win32':
        // Try multiple methods on Windows
        command = 'powershell';
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

// Tool: Play a simple tone
server.tool(
  "play_tone",
  playToneSchema,
  async ({ frequency, duration, waveform }) => {
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
        
        buffer[i] = sample * 0.3; // Reduce volume
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
);

// Tool: Play a melody
server.tool(
  "play_melody",
  playMelodySchema,
  async ({ notes, tempo }) => {
    try {
      // Calculate total duration
      const beatDuration = 60 / tempo; // Duration of one beat in seconds
      let totalDuration = 0;
      
      const processedNotes = notes.map(note => {
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
          buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
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
);

// Tool: Play a chord
server.tool(
  "play_chord",
  playChordSchema,
  async ({ notes, duration }) => {
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
          buffer[i] += Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2 / notes.length;
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
);

// Tool: Generate sound effects
server.tool(
  "generate_sound_effect",
  generateSoundEffectSchema,
  async ({ type, variant }) => {
    try {
      const sampleRate = 44100;
      let buffer: Float32Array;
      
      switch (type) {
        case "beep":
          buffer = generateBeep(sampleRate, variant);
          break;
        case "alert":
          buffer = generateAlert(sampleRate, variant);
          break;
        case "notification":
          buffer = generateNotification(sampleRate, variant);
          break;
        case "error":
          buffer = generateError(sampleRate, variant);
          break;
        case "success":
          buffer = generateSuccess(sampleRate, variant);
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
);

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
function generateBeep(sampleRate: number, variant: number): Float32Array {
  const duration = 0.2;
  const frequency = variant === 1 ? 800 : variant === 2 ? 1000 : 1200;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.PI * t / duration);
    buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
  }
  
  return buffer;
}

function generateAlert(sampleRate: number, variant: number): Float32Array {
  const duration = 0.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  const freq1 = variant === 1 ? 523.25 : variant === 2 ? 659.25 : 783.99; // C5, E5, G5
  const freq2 = variant === 1 ? 659.25 : variant === 2 ? 783.99 : 1046.50; // E5, G5, C6
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < duration / 2 ? freq1 : freq2;
    const envelope = 0.5;
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
  }
  
  return buffer;
}

function generateNotification(sampleRate: number, variant: number): Float32Array {
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
      buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }
  }
  
  return buffer;
}

function generateError(sampleRate: number, variant: number): Float32Array {
  const duration = 0.4;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);
  
  const baseFreq = variant === 1 ? 200 : variant === 2 ? 150 : 100;
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wobble = Math.sin(2 * Math.PI * 6 * t) * 20;
    const envelope = Math.exp(-t * 3);
    buffer[i] = Math.sin(2 * Math.PI * (baseFreq + wobble) * t) * envelope * 0.4;
  }
  
  return buffer;
}

function generateSuccess(sampleRate: number, variant: number): Float32Array {
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
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
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
