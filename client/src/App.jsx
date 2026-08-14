import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { ModalProvider } from './components/Modal';
import { ErrorBoundary } from './components/ErrorBoundary';
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ApplyPage from './pages/ApplyPage';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Applications from './pages/Applications';
import Interviews from './pages/Interviews';
import Onboarding from './pages/Onboarding';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Leaves from './pages/Leaves';
import Communication from './pages/Communication';
import Evaluation from './pages/Evaluation';
import Certificates from './pages/Certificates';

// Styles
import './tailwind.css';
import './css/main.css';
import './css/components.css';
import './css/sidebar.css';
import './css/dashboard.css';

import { X, Check, KeyRound, Pencil } from 'lucide-react';
import { getInitials } from './utils/helpers';

function AppContent() {
  const { isAuthenticated, user, updateUser, refreshUser, token } = useAuth();
  const { showToast } = useToast();

  const [page, setPage] = useState('landing');
  const [currentModule, setCurrentModule] = useState('dashboard');

  // Modal States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    college: '',
    department: '',
    photoFile: null,
    photoPreview: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Update root page status based on auth status
  useEffect(() => {
    if (isAuthenticated) {
      setPage('dashboard');
    } else {
      setPage('landing');
    }
  }, [isAuthenticated]);

  const handleOpenEditProfile = () => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
      college: user.college || '',
      department: user.department || '',
      photoFile: null,
      photoPreview: user.photo || ''
    });
    setEditProfileOpen(true);
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileForm((prev) => ({
          ...prev,
          photoFile: file,
          photoPreview: ev.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const formData = new FormData();
    formData.append('name', profileForm.name);
    formData.append('phone', profileForm.phone);
    formData.append('college', profileForm.college);
    formData.append('department', profileForm.department);
    if (profileForm.photoFile) {
      formData.append('photo', profileForm.photoFile);
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update profile');
      }

      updateUser(data.user);
      showToast('Profile updated successfully!', 'success');
      setEditProfileOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setChangePasswordOpen(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update password');
      }
      showToast('Password updated successfully!', 'success');
      setChangePasswordOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ── Render Modules ──
  const renderModuleContent = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentModule} />;
      case 'analytics':
        return <Analytics />;
      case 'users':
        return <Users />;
      case 'applications':
        return <Applications />;
      case 'interviews':
        return <Interviews />;
      case 'onboarding':
        return <Onboarding />;
      case 'attendance':
        return <Attendance onNavigate={setCurrentModule} />;
      case 'tasks':
        return <Tasks />;
      case 'leaves':
        return <Leaves />;
      case 'communication':
        return <Communication />;
      case 'evaluation':
        return <Evaluation />;
      case 'certificates':
        return <Certificates />;
      default:
        return <Dashboard onNavigate={setCurrentModule} />;
    }
  };

  // ── Render Pages ──
  if (page === 'landing') {
    return <LandingPage onGoToLogin={() => setPage('login')} />;
  }

  if (page === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => setPage('dashboard')}
        onGoToSignup={() => setPage('signup')}
        onGoToApply={() => setPage('apply')}
        onGoToHome={() => setPage('landing')}
      />
    );
  }

  if (page === 'signup') {
    return (
      <SignupPage
        onSignupSuccess={() => setPage('dashboard')}
        onGoToLogin={() => setPage('login')}
        onGoToHome={() => setPage('landing')}
      />
    );
  }

  if (page === 'apply') {
    return <ApplyPage onBackToLogin={() => setPage('login')} />;
  }

  if (page === 'dashboard') {
    return (
      <>
        <DashboardLayout
          currentModule={currentModule}
          onNavigate={setCurrentModule}
          onEditProfile={handleOpenEditProfile}
          onChangePassword={handleOpenChangePassword}
        >
          {renderModuleContent()}
        </DashboardLayout>

        {/* Edit Profile Modal */}
        {editProfileOpen && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditProfileOpen(false); }}>
            <div className="modal glass-card">
              <div className="modal-header">
                <h3>Edit Profile</h3>
                <button className="modal-close" onClick={() => setEditProfileOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '12px', width: '100%' }}>
                      <label style={{ alignSelf: 'flex-start', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Profile Photo
                      </label>
                      <div
                        className="profile-photo-upload-wrapper"
                        onClick={() => document.getElementById('photo-input').click()}
                        title="Click to change photo"
                        style={{ cursor: 'pointer' }}
                      >
                        <div id="profile-photo-preview" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {profileForm.photoPreview ? (
                            <img src={profileForm.photoPreview} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            <div className="avatar">{getInitials(user?.name)}</div>
                          )}
                        </div>
                        <div className="photo-upload-overlay">
                          <Pencil size={22} color="white" />
                        </div>
                      </div>
                      <input
                        type="file"
                        id="photo-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProfilePhotoChange}
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Click on the photo to upload. Max 5MB. JPG, PNG or WebP.
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        style={{ opacity: 0.6, cursor: 'not-allowed' }}
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Email cannot be changed
                      </small>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="10-digit number"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>College</label>
                        <input
                          type="text"
                          value={profileForm.college}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, college: e.target.value }))}
                          placeholder="Your college"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Department</label>
                      <select
                        value={profileForm.department}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                      >
                        <option value="">Select Department</option>
                        {[
                          'Digital Marketing',
                          'HR & Recruitment',
                          'Business Development',
                          'Social Media',
                          'Entrepreneurship Training',
                          'IT Support',
                          'Management'
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditProfileOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? (
                      <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                    ) : (
                      <>
                        <Check size={14} style={{ marginRight: '4px' }} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {changePasswordOpen && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setChangePasswordOpen(false); }}>
            <div className="modal glass-card">
              <div className="modal-header">
                <h3>Change Password</h3>
                <button className="modal-close" onClick={() => setChangePasswordOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSavePassword}>
                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                      <label>Current Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        minLength={6}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter new password"
                        minLength={6}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setChangePasswordOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updatingPassword}>
                    {updatingPassword ? (
                      <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                    ) : (
                      <>
                        <KeyRound size={14} style={{ marginRight: '4px' }} /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ModalProvider>
            <AppContent />
          </ModalProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
