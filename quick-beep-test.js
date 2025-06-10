// Quick test to make a beep sound
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

// Generate a simple beep
const sampleRate = 44100;
const duration = 0.5;
const frequency = 800;
const numSamples = Math.floor(sampleRate * duration);
const buffer = new Float32Array(numSamples);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  buffer[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3;
}

// Create WAV file
function createWavBuffer(audioData, sampleRate) {
  const length = audioData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  const writeString = (offset, string) => {
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
  
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return Buffer.from(arrayBuffer);
}

// Save and play
const wavBuffer = createWavBuffer(buffer, sampleRate);
const tempFile = join(tmpdir(), `test_beep_${Date.now()}.wav`);
writeFileSync(tempFile, wavBuffer);

console.log(`Created test audio file: ${tempFile}`);
console.log('Playing beep...');

// Play the file
const player = spawn('powershell', ['-c', `(New-Object Media.SoundPlayer "${tempFile}").PlaySync()`]);

player.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Sound played successfully!');
  } else {
    console.log('❌ Error playing sound. Code:', code);
  }
});

player.on('error', (err) => {
  console.error('Error:', err.message);
});
