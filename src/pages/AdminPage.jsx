import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AdminPage() {
  const [password, setPassword] = useState(localStorage.getItem('admin_pw') || '');
  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  const headers = { 'x-admin-password': password, 'Content-Type': 'application/json' };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
      if (!res.ok) throw new Error('Invalid password');
      const data = await res.json();
      setStats(data);
      setLoggedIn(true);
      setError('');
      localStorage.setItem('admin_pw', password);
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const grantTestCredits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/test-credits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: 10 }),
      });
      const data = await res.json();
      setTestResult(data);
      refreshStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  };

  if (!loggedIn) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <h1>Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin}>Login</button>
          {error && <p className="admin-error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="admin-refresh" onClick={refreshStats}>Refresh</button>
      </div>

      {/* Summary */}
      {stats?.summary && (
        <div className="admin-summary">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.summary.totalUsers}</span>
            <span className="admin-stat-label">Users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.summary.totalCreditsPurchased}</span>
            <span className="admin-stat-label">Credits Purchased</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.summary.totalCreditsUsed}</span>
            <span className="admin-stat-label">Credits Used</span>
          </div>
        </div>
      )}

      {/* Test Credits */}
      <div className="admin-section">
        <h2>Test Mode</h2>
        <button className="admin-btn" onClick={grantTestCredits}>Grant 10 Test Credits</button>
        {testResult && (
          <div className="admin-test-result">
            <p>Token: <code>{testResult.adminToken}</code></p>
            <p>Credits: {testResult.creditsRemaining}</p>
            <p className="admin-hint">Use this token in localStorage as <code>yt_user_token</code> to test paid features.</p>
            <button className="admin-btn-small" onClick={() => {
              localStorage.setItem('yt_user_token', testResult.adminToken);
              localStorage.setItem('yt_session', JSON.stringify({ token: testResult.adminToken, expiresAt: new Date(Date.now() + 365 * 86400000).toISOString() }));
              alert('Test session activated. Reload the page to use paid features.');
            }}>
              Activate Test Session
            </button>
          </div>
        )}
      </div>

      {/* Users */}
      {stats?.users?.length > 0 && (
        <div className="admin-section">
          <h2>Users ({stats.users.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Remaining</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((u, i) => (
                  <tr key={i}>
                    <td><code>{u.user_token?.substring(0, 16)}...</code></td>
                    <td>{u.credits_remaining}</td>
                    <td>{u.credits_total}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>{formatDate(u.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage History */}
      {stats?.recentUsage?.length > 0 && (
        <div className="admin-section">
          <h2>Recent Usage ({stats.recentUsage.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Credits</th>
                  <th>URL / File</th>
                  <th>Duration</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsage.map((u, i) => (
                  <tr key={i}>
                    <td><span className={`usage-badge ${u.usage_type}`}>{u.usage_type}</span></td>
                    <td>{u.credits_used}</td>
                    <td className="admin-url">{u.video_url || u.file_name || '-'}</td>
                    <td>{u.duration_seconds ? `${Math.ceil(u.duration_seconds / 60)}min` : '-'}</td>
                    <td>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.message && <p className="admin-hint">{stats.message}</p>}
    </div>
  );
}
