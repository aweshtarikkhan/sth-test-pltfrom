const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

code = code.replace(
  "import { Send, UserCircle2, Users, MessageSquare, Plus, Check, CheckCheck, UserPlus, X, ShieldAlert } from 'lucide-react';",
  "import { Send, UserCircle2, Users, MessageSquare, Plus, Check, CheckCheck, UserPlus, X, ShieldAlert, Search, ChevronLeft, Phone, Video, Info, MessageCircle, Clock } from 'lucide-react';"
);

fs.writeFileSync('src/pages/ChatPage.tsx', code);
console.log("Fixed imports in ChatPage!");
