const fs = require('fs');
const file = 'src/components/ui/popover.tsx';
let c = fs.readFileSync(file, 'utf8');

// Replace z-50 with z-[100005]
c = c.replace('z-50', 'z-[100005]');

fs.writeFileSync(file, c);
console.log('Fixed popover z-index');
