import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!email.endsWith('@nitc.ac.in')) {
      alert("Please use your official @nitc.ac.in email address.");
      setLoading(false);
      return;
    }

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else if (isSignUp) alert("Check your NITC email for the confirmation link!");
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) return alert("Please enter your email first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) alert(error.message);
    else alert("Password reset link sent to your NITC email!");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>NITC Hub</h1>
        <p style={styles.subtitle}>{isSignUp ? 'Create account' : 'Welcome back!'}</p>

        <form onSubmit={handleAuth} style={styles.form}>
          <input type="email" placeholder="NITC Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>
        
        <span onClick={handleResetPassword} style={styles.forgotLink}>Forgot Password?</span>

        <p style={styles.toggleText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span onClick={() => setIsSignUp(!isSignUp)} style={styles.link}>
            {isSignUp ? 'Login here' : 'Sign up now'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #007bff 0%, #00d4ff 100%)' },
  card: { background: 'white', padding: '40px', borderRadius: '20px', width: '90%', maxWidth: '400px', textAlign: 'center' },
  logo: { fontSize: '32px', color: '#007bff', margin: '0 0 10px 0' },
  subtitle: { color: '#666', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd' },
  button: { padding: '12px', borderRadius: '8px', border: 'none', background: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  forgotLink: { color: '#007bff', fontSize: '12px', display: 'block', marginTop: '10px', cursor: 'pointer' },
  toggleText: { marginTop: '20px', fontSize: '14px' },
  link: { color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }
};