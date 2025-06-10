import { spawn } from 'child_process';
import { createInterface } from 'readline';

// Test tool calls
const testTools = [
  {
    name: "Test 1: Simple Beep",
    request: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "generate_sound_effect",
        arguments: {
          type: "beep",
          variant: 1
        }
      },
      id: 1
    }
  },
  {
    name: "Test 2: Success Sound",
    request: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "generate_sound_effect",
        arguments: {
          type: "success",
          variant: 1
        }
      },
      id: 2
    }
  },
  {
    name: "Test 3: 440Hz Tone",
    request: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "play_tone",
        arguments: {
          frequency: 440,
          duration: 1,
          waveform: "sine"
        }
      },
      id: 3
    }
  },
  {
    name: "Test 4: C Major Chord",
    request: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "play_chord",
        arguments: {
          notes: ["C4", "E4", "G4"],
          duration: "2n"
        }
      },
      id: 4
    }
  },
  {
    name: "Test 5: Simple Melody",
    request: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "play_melody",
        arguments: {
          notes: [
            { note: "C4", duration: "4n" },
            { note: "D4", duration: "4n" },
            { note: "E4", duration: "4n" },
            { note: "C4", duration: "4n" }
          ],
          tempo: 120
        }
      },
      id: 5
    }
  }
];

async function runTest() {
  console.log("Starting MCP Alert Server Test...\n");
  
  // Spawn the server
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle server stderr (status messages)
  server.stderr.on('data', (data) => {
    console.log(`Server: ${data.toString().trim()}`);
  });

  // Create readline interface for server stdout
  const rl = createInterface({
    input: server.stdout,
    crlfDelay: Infinity
  });

  // Handle server responses
  rl.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      if (response.result) {
        console.log(`✅ Response:`, response.result.content[0].text);
      } else if (response.error) {
        console.log(`❌ Error:`, response.error.message);
      }
    } catch (e) {
      // Ignore non-JSON lines
    }
  });

  // Wait for server to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send initialize request
  const initRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    },
    id: 0
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Run tests
  for (const test of testTools) {
    console.log(`\n${test.name}`);
    console.log("Sending request...");
    
    server.stdin.write(JSON.stringify(test.request) + '\n');
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n✨ All tests completed!");
  
  // Cleanup
  server.stdin.end();
  server.kill();
  process.exit(0);
}

// Run the test
runTest().catch(console.error);
