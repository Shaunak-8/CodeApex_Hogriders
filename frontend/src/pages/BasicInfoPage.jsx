import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Phone, Briefcase, MapPin, ArrowRight } from 'lucide-react';

export default function BasicInfoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '', occupation: '', location: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user, session } } = await supabase.auth.getSession();
      if (user && session?.access_token) {
        // Store profile info in Supabase user metadata
        await supabase.auth.updateUser({
          data: { 
            full_name: form.fullName, 
            phone: form.phone, 
            occupation: form.occupation, 
            location: form.location 
          }
        });

        // Sync with backend Neon DB
        await fetch(`${import.meta.env.VITE_API_URL}/me`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${session.access_token}`
           },
           body: JSON.stringify({
             email: user.email,
             profile_data: form
           })
        });
      }
      navigate('/connect-repo');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Progress */}
        <div style={styles.progress}>
          <div style={styles.stepDone}></div>
          <div style={styles.stepActive}></div>
          <div style={styles.stepTodo}></div>
          <div style={styles.stepTodo}></div>
        </div>

        <p style={styles.eyebrow}>STEP 2 OF 4</p>
        <h1 style={styles.title}>Tell Us About You</h1>
        <p style={styles.sub}>This helps us personalize your experience.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}><User size={12} /> Full Name</label>
              <input style={styles.input} placeholder="John Doe" value={form.fullName} onChange={e => update('fullName', e.target.value)} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Phone size={12} /> Phone Number</label>
              <input style={styles.input} placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
          </div>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Briefcase size={12} /> Occupation</label>
              <select style={styles.input} value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                <option value="">Select...</option>
                <option value="student">Student</option>
                <option value="developer">Software Developer</option>
                <option value="devops">DevOps Engineer</option>
                <option value="lead">Tech Lead</option>
                <option value="manager">Engineering Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}><MapPin size={12} /> Location</label>
              <input style={styles.input} placeholder="City, Country" value={form.location} onChange={e => update('location', e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading || !form.fullName} style={styles.btn}>
            {loading ? 'SAVING...' : 'CONTINUE'} <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif" },
  container: { width: 560, padding: 48 },
  progress: { display: 'flex', gap: 6, marginBottom: 32 },
  stepDone: { flex: 1, height: 3, borderRadius: 2, background: '#00ff88' },
  stepActive: { flex: 1, height: 3, borderRadius: 2, background: 'linear-gradient(to right, #00ff88, #1e1e2e)' },
  stepTodo: { flex: 1, height: 3, borderRadius: 2, background: '#1e1e2e' },
  eyebrow: { fontSize: 10, letterSpacing: 3, color: '#00ff88', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 8 },
  sub: { color: '#555', fontSize: 12, marginBottom: 36, fontFamily: "'JetBrains Mono', monospace" },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 10, color: '#555', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 },
  input: { background: '#111118', border: '1px solid #1e1e2e', borderRadius: 10, color: '#fff', padding: '12px 14px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: '14px', background: 'linear-gradient(135deg, #00ff88, #00cc6a)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13 },
};
