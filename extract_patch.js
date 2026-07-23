const fs = require('fs');

const transcriptPath = 'C:\\Users\\Anderson\\.gemini\\antigravity\\brain\\d95e706d-2e65-406e-9b81-fb3ba3d9bb4c\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    // Look for the step that contains the output of "git diff src/views/AdminPortal.tsx"
    if (obj.tool_calls && obj.tool_calls.some(t => t.function.name === 'default_api:run_command' && t.function.arguments.includes('git diff'))) {
        // The NEXT system message (or model response) will have the tool response
    }
    
    // Check if content has the git diff output
    if (obj.content && obj.content.includes('diff --git a/src/views/AdminPortal.tsx b/src/views/AdminPortal.tsx')) {
        let diffContent = obj.content;
        // The content might have "The command completed successfully.\nOutput:\n" prefix.
        const marker = "diff --git a/src/views/AdminPortal.tsx b/src/views/AdminPortal.tsx";
        const startIdx = diffContent.indexOf(marker);
        if (startIdx !== -1) {
            fs.writeFileSync('patch.diff', diffContent.substring(startIdx));
            console.log('Patch extracted successfully.');
            process.exit(0);
        }
    }
  } catch (e) {
      // ignore parse errors
  }
}
console.log('Patch not found.');
