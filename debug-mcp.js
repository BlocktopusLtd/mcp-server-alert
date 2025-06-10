import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log("🔍 MCP Server Alert Debug Test\n");

// Spawn the server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Capture all output
let responses = [];

// Handle server stderr (status messages)
server.stderr.on('data', (data) => {
  console.log(`[STDERR] ${data.toString().trim()}`);
});

// Create readline interface for server stdout
const rl = createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

// Handle server responses
rl.on('line', (line) => {
  console.log(`[STDOUT] ${line}`);
  responses.push(line);
});

// Wait for server to start
setTimeout(async () => {
  console.log("\n📤 Sending initialize request...");
  
  const initRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "debug-client",
        version: "1.0.0"
      }
    },
    id: 1
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait for response
  setTimeout(() => {
    console.log("\n📤 Sending tools/list request...");
    
    const listToolsRequest = {
      jsonrpc: "2.0",
      method: "tools/list",
      id: 2
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    
    // Try to call a tool
    setTimeout(() => {
      console.log("\n📤 Sending generate_sound_effect tool call...");
      
      const toolCallRequest = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "generate_sound_effect",
          arguments: {
            type: "beep",
            variant: 1
          }
        },
        id: 3
      };
      
      server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
      
      // Wait and then cleanup
      setTimeout(() => {
        console.log("\n📊 Summary of responses:");
        responses.forEach((resp, i) => {
          try {
            const parsed = JSON.parse(resp);
            console.log(`\nResponse ${i + 1}:`, JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log(`\nResponse ${i + 1} (raw):`, resp);
          }
        });
        
        server.stdin.end();
        server.kill();
        process.exit(0);
      }, 2000);
    }, 1000);
  }, 1000);
}, 1000);

server.on('error', (err) => {
  console.error('Server spawn error:', err);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});
