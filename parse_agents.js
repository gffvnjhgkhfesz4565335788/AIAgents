const fs = require('fs');

let content = fs.readFileSync('./src/data/agents.ts', 'utf8');

const mapsKeywordRegex = /(navigate|route|map|nearby|surroundings|walking distance|closest station|find nearest|Google Maps|locations|closest ATM|nearest EV)/i;

let modifications = 0;

const result = content.replace(/stats:\s*\[[\s\S]*?\]\s*\}/g, (match, offset, str) => {
  const beforeMatch = str.substring(Math.max(0, offset - 600), offset);
  
  if (beforeMatch.match(mapsKeywordRegex)) {
    if (!match.includes('tools:')) {
      modifications++;
      return match.replace(/\}\s*$/, ',\n        tools: [{ googleMaps: {} }]\n      }');
    }
  }
  return match;
});

fs.writeFileSync('./src/data/agents.ts', result, 'utf8');
console.log(`Modified ${modifications} agents to include googleMaps tool.`);
