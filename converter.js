const readline = require('readline');
const fs = require('fs');

let input;

if (process.argv.length === 2) {
  input = process.stdin;
} else {
  console.log('bad', process.argv);
}

let mode = 'normal';
let type;
let indent = '';

const varDef = /^(\s*)(var|let|const)\s*\w+\s*=/;

processFile(input).then(console.log).catch(e => {
  console.error(e);
  process.exit();
});

function processFile(stream) {
  const rl = readline.createInterface({
    input: stream,
  });

  let collect = '';

  return new Promise((resolve, reject) => {
    let active = true;
    rl.on('close', () => {
      resolve(collect);
    });

    rl.on('line', line => {
      if (!active) {
        return;
      }
      line = line
        .replace(/\s+$/, '')
        .replace(/\s==\s/, ' === ')
        .replace(/\s!=\s/, ' !== ')
        .replace(/\s!=\s/, ' !== ')
        .replace(/"([^']+)"/g, '\'$1\'');

      const indentMatch = line.match(/^\s+/);
      if (indentMatch) {
        if (indentMatch[0] === '  ') {
          reject('file already cotinains double-space indentation');
          rl.close();
          active = false;
          return;
        }
        line = line.replace(/^\s+/, new Array(Math.floor(indentMatch[0].length / 2 + 1)).join(' '));
      }

      if (mode === 'varDef') {
        let match;
        if (match = line.match(/^\s*(\w+)\s*=/)) {
          line = indent + type + ' ' + match[1] + ' = ' + line.replace(/^(\s*)\w+\s*=\s*/, '');
        }

      }

      if (mode === 'normal') {
        let match;

        if (match = line.match(varDef)) {
          type = match[2];
          indent = match[1];
          mode = 'varDef';
          //collect += '*********** enter\n';
        }
      }

      if (line.match(/^\s*let\s*\w+\s=\s*require\(/)) {
        line = line.replace(/^(\s*)let\s/, '$1const ');
      }

      if (mode === 'varDef') {
        if (line.match(/[;{]$/)) {
          mode = 'normal';
          //collect += '*********** exit\n';
        } else {
          line = line.replace(/,$/, ';');
        }
      }

      if (line !== null) {
        collect += line + '\n';
      }
    });
  });
}
