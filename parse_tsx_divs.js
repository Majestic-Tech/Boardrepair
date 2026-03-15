const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Very crude parsing for <div> and </div> ignoring comments/strings for a moment
  // It's mostly enough to spot the structural mismatch if we print it line by line
  let openers = (line.match(/<(div|main|header|nav)[^a-zA-Z]/g) || []).length;
  let selfClosers = (line.match(/<(div|main|header|nav)[^>]*\/>/g) || []).length;
  // A <div ...> that doesn't close itself is opened
  let actualOpeners = openers - selfClosers;
  
  let closers = (line.match(/<\/(div|main|header|nav)>/g) || []).length;
  
  if (actualOpeners > 0) {
    for (let o=0;o<actualOpeners;o++) stack.push(i + 1);
  }
  if (closers > 0) {
    for (let c=0;c<closers;c++) {
      if (stack.length > 0) {
        stack.pop();
      } else {
        console.log(`Unmatched closer at line ${i + 1}`);
      }
    }
  }
}

console.log('Unclosed tags matching opening lines:', stack);
