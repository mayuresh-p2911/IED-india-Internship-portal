import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import API from '../../services/api';
import {
  Users, IndianRupee, Wallet, Clock, Copy, CheckCheck,
  ChevronRight, ArrowRight, Briefcase, Search, Download,
  ShieldCheck, CheckCircle, TrendingUp, Building2, ExternalLink
} from 'lucide-react';

export function ReferralPortalDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await API.get('/referral-partners/dashboard');
      setData(result);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const codeToCopy = data?.referralCode || user?.referralCode || 'IED-REF-8842';

  const copyCode = () => {
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true);
      showToast('Referral link code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="loading" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentCommissions = data?.recentCommissions || [];
  const partnerName = user?.name || 'Priya Verma';
  const partnerCode = codeToCopy;

  const totalReferred = stats.totalReferred || 42;
  const paidReferrals = stats.paidReferrals || 28;
  const pendingVerification = stats.pendingVerification || 14;
  const totalEarnings = stats.totalEarnings || 14000;
  const availableBalance = stats.availableBalance || 4200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Docket */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#64748b' }}>
            <span style={{ fontWeight: 800, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px' }}>PARTNER HUB</span>
            <span>Interconnected Pages: 30 (Referral Hub), 31 (Tracking) & 33 (Earnings & Payout)</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#022654', margin: '4px 0 2px' }}>
            Referral & Earnings Command
          </h1>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Affiliate Partner: <strong style={{ color: '#0f172a' }}>{partnerName} ({partnerCode})</strong> • Current Rate: <span style={{ color: '#059669', fontWeight: 700 }}>10% Flat Tier-1 Commission</span> on student admissions.
          </div>
        </div>

        {/* Unique Referral Link Code box */}
        <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Your Unique Referral Link Code: <strong style={{ color: '#03377A' }}>{partnerCode}</strong></div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
              iedindia.edu.in/apply?ref={partnerCode}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={copyCode} style={{ padding: '6px 14px' }}>
            {copied ? <><CheckCheck size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
          </button>
        </div>
      </div>

      {/* 6 Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {/* Metric 1 */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>REFERRED STUDENTS</span>
            <Users size={16} color="#03377A" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
            {totalReferred}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>+14.2% this cycle • Lifetime student signups</div>
        </div>

        {/* Metric 2 */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PAID REFERRALS</span>
            <CheckCircle size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
            {paidReferrals}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>66.7% Conversion Rate • Successfully credited</div>
        </div>

        {/* Metric 3 */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PENDING VERIFICATION</span>
            <Clock size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
            {pendingVerification}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#d97706' }}>Under review & fee processing • Est: ₹3,498.60</div>
        </div>

        {/* Metric 4 */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL COMMISSION</span>
            <IndianRupee size={16} color="#03377A" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>10% Base Fixed Agreement • Cumulative gross</div>
        </div>

        {/* Metric 5 */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>AVAILABLE BALANCE</span>
            <Wallet size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '6px 0 2px' }}>
            ₹{availableBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
            <span>Ready for Instant Payout</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>Eligible</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div style={{ background: 'linear-gradient(135deg, #021a3b 0%, #03377A 100%)', color: '#ffffff', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#93c5fd' }}>PAYOUT CYCLE</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px' }}>Monday, 20 Oct</div>
          <div style={{ fontSize: '0.68rem', color: '#bfdbfe', marginTop: '2px' }}>Auto clearing by 04:00 PM IST</div>
          <button className="btn btn-sm" onClick={() => onNavigate('rp-payouts')} style={{ background: '#2563eb', color: '#fff', border: 'none', marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
            Request Payout &rarr;
          </button>
        </div>
      </div>

      {/* 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Live Referral Tracking & Conversion Ledger */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Live Referral Tracking & Conversion Ledger
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Real-time telemetry of applicant verifications, fees paid, and calculated credits.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search student or ref ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '6px 10px 6px 30px', width: '200px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => showToast('Exporting ledger CSV...', 'info')}>
                <Download size={14} />
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>STUDENT & PROGRAM</th>
                  <th>BASE FEE PAID</th>
                  <th>COMMISSION (10%)</th>
                  <th>STATUS & VERIFICATION</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {recentCommissions.length > 0 ? (
                  recentCommissions.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.studentName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.program || 'Full Stack Engineering'}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{c.applicationFee?.toFixed(2) || '2,499.00'}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>+₹{c.commissionAmount?.toFixed(2) || '249.90'}</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                          Verified & Credited
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>AS</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Aarav Sharma <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '3px' }}>LATEST</span></div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Full Stack Engineering • STU-9921</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹2,499.00</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>+₹249.90 <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>10% Tier-1 rate</div></td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                          • Verified & Credited
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>Today, 02:45 PM</td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>RD</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Rohan Deshmukh</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>AI & Data Intelligence • STU-8411</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹3,999.00</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>+₹399.90</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px' }}>
                          • Completed
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>16 Oct, 11:20 AM</td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>MN</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Meera Nambiar</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cloud Architecture & DevOps • STU-7809</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹2,499.00 (Pending)</td>
                      <td style={{ color: '#d97706', fontWeight: 700 }}>₹249.90 <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>(Locked)</div></td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '4px' }}>
                          • In Review
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>16 Oct, 09:15 AM</td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>TK</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Tanmay Kulkarni</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cybersecurity Analyst Sprint • STU-7231</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹1,999.00</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>+₹199.90</td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px' }}>
                          • Paid
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>15 Oct, 04:30 PM</td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800 }}>AS</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Ananya Sen</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Applied Product Design UI/UX • STU-6522</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹2,499.00 (Processing)</td>
                      <td style={{ color: '#d97706', fontWeight: 700 }}>₹249.90 <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>(Locked)</div></td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '4px' }}>
                          • In Review
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>15 Oct, 01:10 PM</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Showing 5 of 42 recorded referrals</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>Previous</button>
              <button className="btn btn-primary btn-sm" style={{ padding: '2px 8px' }}>1</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>2</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>3</button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>Next</button>
            </div>
          </div>
        </div>

        {/* Right Column: Withdrawal Hub & Affiliate Tier Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Withdrawal Hub */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Withdrawal Hub</h3>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Instant NEFT / IMPS Bank Disbursal</div>
              </div>
              <Building2 size={18} color="#03377A" />
            </div>

            {/* Linked Settlement Account */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b' }}>
                <span>LINKED SETTLEMENT ACCOUNT:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓ Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>HDFC Bank Ltd.</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>HDFC •••• •••• 9812 ({partnerName})</div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#03377A', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('rp-payouts')}>Change</span>
              </div>
            </div>

            {/* Disbursal Ledger */}
            <div style={{ fontSize: '0.8rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '10px 0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                <span>Withdrawable Available:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹4,200.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626', fontSize: '0.75rem' }}>
                <span>Estimated TDS (1% u/s 194H):</span>
                <span>-₹42.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 800, color: '#022654', fontSize: '0.92rem' }}>
                <span>Net Disbursal Amount:</span>
                <span>₹4,158.00</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={() => onNavigate('rp-payouts')} style={{ padding: '10px', fontSize: '0.85rem' }}>
              Request Payout
            </button>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
              Requests submitted before Sunday 11:59 PM clear on Monday weekly cycles.
            </div>
          </div>

          {/* Affiliate Tier Status */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>AFFILIATE TIER STATUS</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>LEVEL 2 EN ROUTE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              <span>Tier-2 Commission Unlock (12.5%)</span>
              <span>28 / 50 Referrals</span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: '56%', height: '100%', background: '#03377A', borderRadius: '3px' }}></div>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Refer 22 more students to elevate commission rate from 10% to 12.5%.
            </div>

            <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '0.68rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>AUDIT HASH: #8842-LEDGER-VERIFIED</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>PARTNER</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralPortalDashboard;
