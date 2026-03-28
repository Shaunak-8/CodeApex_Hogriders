import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Phone, Briefcase, MapPin, ArrowRight, Cpu, Shield, Activity } from 'lucide-react';
import { registerUser } from '../lib/api';

export default function BasicInfoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '', occupation: '', location: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user) {
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
        await registerUser({
          email: user.email,
          profile_data: form
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
      {/* Grid Overlay */}
      <div style={styles.gridOverlay}></div>

      <div style={styles.container}>
        <div style={styles.headerBox}>
            <div style={styles.brandBox}>
                <div style={styles.dot}></div>
                <span style={styles.brand}>MCLOVIN // ONBOARDING</span>
            </div>
            <div style={styles.progressTrack}>
                <div style={styles.progressFill}></div>
                <div style={styles.progressMark}>STEP_01_IDENTITY_SCAN</div>
            </div>
        </div>

        <div style={styles.configBox}>
            <div style={styles.boxHeader}>
                <h1 style={styles.title}>NODE_CONFIGURATION</h1>
                <p style={styles.subtitle}>ESTABLISHING USER_METADATA_PROTOCOLS</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.row}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>PUBLIC_ALIAS</label>
                        <div style={styles.inputWrapper}>
                            <User size={14} style={styles.icon} />
                            <input style={styles.input} placeholder="OPERATOR_NAME" value={form.fullName} onChange={e => update('fullName', e.target.value)} required />
                        </div>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>COMM_UPLINK</label>
                        <div style={styles.inputWrapper}>
                            <Phone size={14} style={styles.icon} />
                            <input style={styles.input} placeholder="+X-XXX-XXX-XXXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div style={styles.row}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>SPECIALIZATION</label>
                        <div style={styles.inputWrapper}>
                            <Briefcase size={14} style={styles.icon} />
                            <select style={styles.input} value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                                <option value="">SELECT_ROLE...</option>
                                <option value="student">STUDENT_PROX</option>
                                <option value="developer">CORE_ENGINEER</option>
                                <option value="devops">ORCHESTRATION_SPECIALIST</option>
                                <option value="lead">SYSTEM_ARCHITECT</option>
                                <option value="manager">GRID_COMMANDER</option>
                                <option value="other">NODE_OPERATOR</option>
                            </select>
                        </div>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>GEO_LOCATION</label>
                        <div style={styles.inputWrapper}>
                            <MapPin size={14} style={styles.icon} />
                            <input style={styles.input} placeholder="SECTOR_01_REGION" value={form.location} onChange={e => update('location', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div style={styles.systemStatus}>
                    <div style={styles.statusLine}>
                        <span style={styles.sysLabel}>INTEGRITY:</span>
                        <span style={styles.sysVal}>VERIFIED</span>
                    </div>
                    <div style={styles.statusLine}>
                        <span style={styles.sysLabel}>LATENCY:</span>
                        <span style={styles.sysVal}>4ms</span>
                    </div>
                </div>

                <button type="submit" disabled={loading || !form.fullName} style={styles.btn}>
                    <Activity size={18} />
                    <span>{loading ? 'SYNCHRONIZING...' : 'SYNCHRONIZE_IDENTITY'}</span>
                </button>
            </form>
        </div>

        <div style={styles.footer}>
            <span style={styles.footerText}>[ WARNING: ENSURE DATA ACCURACY FOR CORE SYNC ]</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', color: '#fff', fontFamily: "var(--font-heading)", position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  gridOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundSize: '60px 60px', backgroundImage: 'linear-gradient(rgba(30, 30, 46, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 46, 0.1) 1px, transparent 1px)', pointerEvents: 'none', zIndex: -1 },

  container: { width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24, padding: 30 },
  headerBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  brandBox: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, background: 'var(--green)', boxShadow: '0 0 8px var(--green)', borderRadius: '1px' },
  brand: { fontSize: 12, fontWeight: 800, letterSpacing: 2, color: 'var(--green)', opacity: 0.8 },
  
  progressTrack: { width: 200, position: 'relative' },
  progressFill: { width: '50%', height: 2, background: 'var(--green)', boxShadow: '0 0 5px var(--green)' },
  progressMark: { fontSize: 8, letterSpacing: 1, color: 'var(--green)', position: 'absolute', top: -12, right: 0, fontWeight: 700 },

  configBox: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '60px', borderRadius: 2, position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' },
  boxHeader: { marginBottom: 48, borderLeft: '4px solid var(--green)', paddingLeft: 24 },
  title: { fontSize: 32, fontWeight: 800, letterSpacing: 2, marginBottom: 8 },
  subtitle: { fontSize: 10, letterSpacing: 3, color: 'var(--text-secondary)', fontWeight: 600, fontFamily: "var(--font-mono)" },

  form: { display: 'flex', flexDirection: 'column', gap: 32 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 9, letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 700, fontFamily: "var(--font-mono)" },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 2 },
  icon: { marginLeft: 16, color: 'var(--text-secondary)', opacity: 0.5 },
  input: { width: '100%', background: 'transparent', border: 'none', padding: '16px 16px 16px 12px', color: '#fff', fontSize: 13, fontFamily: "var(--font-mono)", outline: 'none' },

  systemStatus: { display: 'flex', gap: 32, marginTop: 10 },
  statusLine: { display: 'flex', gap: 8, fontSize: 8, fontFamily: "var(--font-mono)" },
  sysLabel: { color: 'var(--text-secondary)' },
  sysVal: { color: 'var(--green)', fontWeight: 700 },

  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '20px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 13, letterSpacing: 2, transition: '0.3s', marginTop: 24 },
  
  footer: { textAlign: 'center', marginTop: 12 },
  footerText: { fontSize: 8, letterSpacing: 2, color: 'var(--text-secondary)', opacity: 0.5, fontFamily: "var(--font-mono)" }
};
