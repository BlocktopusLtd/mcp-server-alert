# MCP Server Alert Examples

Here are some example prompts you can use with the MCP Server Alert in Claude or other MCP-compatible clients:

## Basic Tone Generation

```
"Play a 440Hz tone for 2 seconds"
"Generate a 1000Hz square wave for half a second"
"Create a sawtooth wave at 200Hz for 1.5 seconds"
```

## Musical Melodies

```
"Play a C major scale"
"Play Happy Birthday melody"
"Create a simple ascending melody: C4 D4 E4 F4 G4"
```

## Chords

```
"Play a C major chord (C4, E4, G4)"
"Play a D minor chord"
"Play an F major 7th chord"
```

## Sound Effects

```
"Play a notification sound"
"Generate an error beep"
"Play a success sound effect"
"Create an alert sound, variant 2"
```

## Complex Examples

```
"Play a doorbell sound (two notes: E5 for 0.3s, then C5 for 0.5s)"
"Create a warning alarm that alternates between 800Hz and 600Hz"
"Play the Windows XP startup sound melody"
```

## Example JSON for Direct Tool Calls

If you're integrating directly with the MCP protocol, here are the tool call formats:

### Play Tone
```json
{
  "tool": "play_tone",
  "arguments": {
    "frequency": 440,
    "duration": 1,
    "waveform": "sine"
  }
}
```

### Play Melody
```json
{
  "tool": "play_melody",
  "arguments": {
    "notes": [
      {"note": "C4", "duration": "4n"},
      {"note": "D4", "duration": "4n"},
      {"note": "E4", "duration": "4n"},
      {"note": "F4", "duration": "4n"},
      {"note": "G4", "duration": "2n"}
    ],
    "tempo": 120
  }
}
```

### Play Chord
```json
{
  "tool": "play_chord",
  "arguments": {
    "notes": ["C4", "E4", "G4"],
    "duration": "2n"
  }
}
```

### Generate Sound Effect
```json
{
  "tool": "generate_sound_effect",
  "arguments": {
    "type": "notification",
    "variant": 1
  }
}
```
