const fs = require('fs');
let code = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');

// 1. Remove Blood Group
code = code.replace(/const \[bloodGroup, setBloodGroup\] = useState\(''\);\n\s*/, '');
code = code.replace(/setBloodGroup\(empData\.blood_group \|\| ''\);\n\s*/, '');
code = code.replace(/if \(bloodGroup\) altPayload\.blood_group = bloodGroup;\n\s*/, '');

const bloodGroupUI = `<div className="space-y-2">
                <Label>Blood Group</Label>
                <div className="relative">
                  <Droplets className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input 
                    value={bloodGroup} 
                    onChange={e => setBloodGroup(e.target.value)} 
                    placeholder="e.g. O+, B-" 
                    className="pl-9 dark:bg-slate-900"
                  />
                </div>
              </div>`;
code = code.replace(bloodGroupUI, '');
code = code.replace("Droplets, ", ""); // Remove import if it was there

// 2. Add Phone Validation in handleUpdateProfile
const oldHandleUpdate = `  const handleUpdateProfile = async () => {
    if (!employee?.id) return;
    setLoadingProfile(true);`;
    
const newHandleUpdate = `  const handleUpdateProfile = async () => {
    if (!employee?.id) return;
    
    // Phone validation (10 digits)
    const cleanPhone = phone.replace(/\\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      toast({ title: 'Invalid Phone Number', description: 'Please enter a valid 10-digit phone number.', variant: 'destructive' });
      return;
    }
    
    setLoadingProfile(true);`;
code = code.replace(oldHandleUpdate, newHandleUpdate);

// 3. Add DOB constraint
// We can define maxDobString right before the return statement
const oldReturn = `  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 md:pb-8">`;
    
const newReturn = `  // Calculate max date for 18 years old
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 18);
  const maxDobString = maxDobDate.toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 md:pb-8">`;
code = code.replace(oldReturn, newReturn);

const oldDob = `<Input 
                    type="date"
                    value={dob} 
                    onChange={e => setDob(e.target.value)} 
                    className="pl-9 dark:bg-slate-900"
                  />`;
const newDob = `<Input 
                    type="date"
                    value={dob} 
                    onChange={e => setDob(e.target.value)} 
                    max={maxDobString}
                    className="pl-9 dark:bg-slate-900"
                  />`;
code = code.replace(oldDob, newDob);

// 4. Update Address Box to Textarea and make it span full width if needed, or just make it bigger
const oldAddress = `<div className="space-y-2">
                <Label>Residential Address</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Your full address" 
                    className="pl-9 dark:bg-slate-900"
                  />
                </div>
              </div>`;
              
const newAddress = `<div className="space-y-2 md:col-span-2">
                <Label>Residential Address</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <textarea 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Your full address" 
                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 pl-9 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-orange-500"
                  />
                </div>
              </div>`;
code = code.replace(oldAddress, newAddress);

// Improve Phone Input UI for digits only
const oldPhone = `<Input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+91 9876543210" 
                    className="pl-9 dark:bg-slate-900"
                  />`;
const newPhone = `<Input 
                    value={phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/\\D/g, '').slice(0, 10);
                      setPhone(val);
                    }} 
                    placeholder="10-digit mobile number" 
                    className="pl-9 dark:bg-slate-900"
                  />`;
code = code.replace(oldPhone, newPhone);

fs.writeFileSync('src/pages/ProfilePage.tsx', code);
console.log("Updated ProfilePage inputs as requested!");
