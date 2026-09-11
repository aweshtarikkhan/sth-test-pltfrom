const fs = require('fs');

let c = fs.readFileSync('src/pages/LeaveManagementPage.tsx', 'utf8');

// Add imports
if (!c.includes('CalendarIcon')) {
  c = c.replace('Umbrella, CheckCircle2, XCircle, Clock, ChevronRight', 'Umbrella, CheckCircle2, XCircle, Clock, ChevronRight, CalendarIcon');
}
if (!c.includes('Popover')) {
  const imports = `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";\n`;
  c = c.replace('import { Input } from "@/components/ui/input";', 'import { Input } from "@/components/ui/input";\n' + imports);
}

const replacement = `{durationType === "single" ? (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Leave Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full h-11 justify-start text-left font-normal rounded-xl", !leaveData.startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {leaveData.startDate ? format(parseISO(leaveData.startDate), "dd/MM/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={leaveData.startDate ? parseISO(leaveData.startDate) : undefined} onSelect={d => {
                      if (d) {
                        const str = format(d, "yyyy-MM-dd");
                        setLeaveData({ ...leaveData, startDate: str, endDate: str });
                      }
                    }} disabled={d => d < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-11 justify-start text-left font-normal rounded-xl px-3", !leaveData.startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{leaveData.startDate ? format(parseISO(leaveData.startDate), "dd/MM/yyyy") : "Pick a date"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={leaveData.startDate ? parseISO(leaveData.startDate) : undefined} onSelect={d => {
                        if (d) setLeaveData({ ...leaveData, startDate: format(d, "yyyy-MM-dd") });
                      }} disabled={d => d < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-11 justify-start text-left font-normal rounded-xl px-3", !leaveData.endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{leaveData.endDate ? format(parseISO(leaveData.endDate), "dd/MM/yyyy") : "Pick a date"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={leaveData.endDate ? parseISO(leaveData.endDate) : undefined} onSelect={d => {
                        if (d) setLeaveData({ ...leaveData, endDate: format(d, "yyyy-MM-dd") });
                      }} disabled={d => leaveData.startDate ? d < parseISO(leaveData.startDate) : d < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}`;

const searchRegex = /\{durationType === "single" \? \([\s\S]*?className="h-11 rounded-xl text-sm" \/>\s*<\/div>\s*<\/div>\s*\)\}/m;

c = c.replace(searchRegex, replacement);

fs.writeFileSync('src/pages/LeaveManagementPage.tsx', c);
console.log('Done replacement');
