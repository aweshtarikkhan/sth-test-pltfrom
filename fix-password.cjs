const fs = require('fs');
let code = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');

// Add oldPassword state
code = code.replace(
  "const [newPassword, setNewPassword] = useState('');",
  "const [oldPassword, setOldPassword] = useState('');\n  const [newPassword, setNewPassword] = useState('');"
);

// Update handleUpdatePassword
const oldHandler = `  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingPassword(false);
    }
  };`;

const newHandler = `  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      toast({ title: 'Please enter your current password.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setLoadingPassword(true);
    try {
      // Verify old password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });
      
      if (verifyError) {
        throw new Error('Current password is incorrect.');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      
      toast({ title: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingPassword(false);
    }
  };`;
code = code.replace(oldHandler, newHandler);

// Update UI
const oldUi = `            <div className="space-y-2">
              <Label>New Password</Label>`;
              
const newUi = `            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input 
                type="password" 
                value={oldPassword} 
                onChange={e => setOldPassword(e.target.value)} 
                placeholder="Enter current password"
                className="dark:bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>`;
code = code.replace(oldUi, newUi);

// Update the disabled condition for the button
const oldDisabled = `disabled={loadingPassword || !newPassword || !confirmPassword}`;
const newDisabled = `disabled={loadingPassword || !oldPassword || !newPassword || !confirmPassword}`;
code = code.replace(oldDisabled, newDisabled);

fs.writeFileSync('src/pages/ProfilePage.tsx', code);
console.log("Updated ProfilePage to require old password for verification");
