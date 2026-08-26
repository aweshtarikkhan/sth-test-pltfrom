const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /<div\s+onClick=\{\(\) => setChangePasswordOpen\(true\)\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

// It's safer to just replace from the Avatar up to the Clock in widget
const startStr = `{/* Avatar Illustration Placeholder */}
            <div className="w-24 h-24 shrink-0 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-inner relative overflow-hidden ml-2">
              <User className="w-12 h-12 text-blue-300 dark:text-slate-500" />
            </div>
          </div>`;
          
const endStr = `{/* Clock In / Out Main Action Widget */}`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCode = code.substring(0, startIndex + startStr.length) + '\n\n          ' + code.substring(endIndex);
  fs.writeFileSync('src/pages/Dashboard.tsx', newCode);
  console.log("Successfully removed the leftover Change Password button.");
} else {
  console.log("Could not find boundaries.");
}
