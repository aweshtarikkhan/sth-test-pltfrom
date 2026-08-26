const fs = require('fs');
let code = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');

// Update states
code = code.replace(
  "const [newEmail, setNewEmail] = useState('');",
  "const [isEmailVerified, setIsEmailVerified] = useState(false);"
);

// Update loadProfileData
const oldLoad = `        setUserEmail(user.email || '');
        
        const { data: empData } = await supabase`;
const newLoad = `        setUserEmail(user.email || '');
        setIsEmailVerified(!!user.email_confirmed_at);
        
        const { data: empData } = await supabase`;
code = code.replace(oldLoad, newLoad);

// Update handleSendEmailOtp
const oldSendOtp = `  const handleSendEmailOtp = async () => {
    if (!newEmail || newEmail === userEmail) {
      toast({ title: 'Please enter a different email address.', variant: 'destructive' });
      return;
    }
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setShowOtpField(true);
      toast({ title: 'OTP sent!', description: 'Please check your new email for the verification OTP.' });
    } catch (error: any) {
      toast({ title: 'Error sending OTP', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingEmail(false);
    }
  };`;

const newSendOtp = `  const handleSendEmailOtp = async () => {
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      });
      if (error) throw error;
      setShowOtpField(true);
      toast({ title: 'OTP sent!', description: 'Please check your email for the verification OTP.' });
    } catch (error: any) {
      toast({ title: 'Error sending OTP', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingEmail(false);
    }
  };`;
code = code.replace(oldSendOtp, newSendOtp);

// Update handleVerifyOtp
const oldVerifyOtp = `  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: newEmail,
        token: otp,
        type: 'email_change'
      });
      if (error) throw error;
      toast({ title: 'Email successfully updated!' });
      setUserEmail(newEmail);
      setShowOtpField(false);
      setNewEmail('');
      setOtp('');
    } catch (error: any) {
      toast({ title: 'Error verifying OTP', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingEmail(false);
    }
  };`;
  
const newVerifyOtp = `  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otp,
        type: 'signup'
      });
      if (error) throw error;
      toast({ title: 'Email successfully verified!' });
      setIsEmailVerified(true);
      setShowOtpField(false);
      setOtp('');
    } catch (error: any) {
      toast({ title: 'Error verifying OTP', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingEmail(false);
    }
  };`;
code = code.replace(oldVerifyOtp, newVerifyOtp);

// Update UI
const oldUi = `            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input value={userEmail} disabled className="bg-gray-50 dark:bg-slate-900" />
            </div>
            
            {!showOtpField ? (
              <div className="space-y-2">
                <Label>New Email Address</Label>
                <div className="flex gap-2">
                  <Input 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    placeholder="Enter new email..."
                    className="dark:bg-slate-900"
                  />
                  <Button onClick={handleSendEmailOtp} disabled={loadingEmail || !newEmail}>
                    {loadingEmail ? 'Sending...' : 'Send OTP'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4 bg-orange-50 dark:bg-slate-900 rounded-xl border border-orange-100 dark:border-slate-700">
                <Label className="text-orange-600 dark:text-orange-400">Enter OTP sent to {newEmail}</Label>`;
                
const newUi = `            <div className="space-y-2">
              <Label>Current Email</Label>
              <div className="flex gap-2">
                <Input value={userEmail} disabled className="bg-gray-50 dark:bg-slate-900" />
                {isEmailVerified ? (
                  <Button variant="outline" disabled className="bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                    Verified
                  </Button>
                ) : (
                  <Button onClick={handleSendEmailOtp} disabled={loadingEmail || showOtpField}>
                    {loadingEmail ? 'Sending...' : 'Verify Email'}
                  </Button>
                )}
              </div>
            </div>
            
            {!isEmailVerified && showOtpField && (
              <div className="space-y-2 p-4 bg-orange-50 dark:bg-slate-900 rounded-xl border border-orange-100 dark:border-slate-700">
                <Label className="text-orange-600 dark:text-orange-400">Enter OTP sent to {userEmail}</Label>`;
code = code.replace(oldUi, newUi);

fs.writeFileSync('src/pages/ProfilePage.tsx', code);
console.log("Updated ProfilePage to verify existing email via OTP");
