import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AdminPage() {
  const [password, setPassword] = useState(localStorage.getItem('admin_pw') || '');
  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Credit management
  const [creditEmail, setCreditEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditResult, setCreditResult] = useState(null);
  const [creditLoading, setCreditLoading] = useState(false);

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

  const handleAddCredits = async () => {
    if (!creditEmail.trim()) return;
    setCreditLoading(true);
    setCreditResult(null);
    try {
      // First, look up user token by email
      const lookupRes = await fetch(`${API_URL}/api/admin/lookup-user?email=${encodeURIComponent(creditEmail.trim())}`, { headers });
      const lookupData = await lookupRes.json();

      if (!lookupRes.ok || !lookupData.userToken) {
        setCreditResult({ error: `ユーザーが見つかりません: ${creditEmail}` });
        setCreditLoading(false);
        return;
      }

      // Add credits
      const res = await fetch(`${API_URL}/api/admin/add-credits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userToken: lookupData.userToken, amount: creditAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreditResult({
        success: true,
        email: creditEmail,
        name: lookupData.name,
        added: creditAmount,
        remaining: data.creditsRemaining,
      });
      refreshStats();
    } catch (err) {
      setCreditResult({ error: err.message });
    }
    setCreditLoading(false);
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

      {/* Credit Management */}
      <div className="admin-section">
        <h2>クレジット管理</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>メールアドレス</label>
            <input
              type="email"
              value={creditEmail}
              onChange={(e) => setCreditEmail(e.target.value)}
              placeholder="user@example.com"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ width: 100 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>付与数</label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(Number(e.target.value))}
              min={1}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>
          <button
            className="admin-btn"
            onClick={handleAddCredits}
            disabled={creditLoading || !creditEmail.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {creditLoading ? '処理中...' : 'クレジット付与'}
          </button>
        </div>
        {creditResult && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: creditResult.error ? '#2a1515' : '#1a2a1a', border: `1px solid ${creditResult.error ? '#5c2020' : '#205c20'}`, fontSize: '0.8rem' }}>
            {creditResult.error ? (
              <span style={{ color: '#f87171' }}>{creditResult.error}</span>
            ) : (
              <span style={{ color: '#4ade80' }}>
                {creditResult.email} ({creditResult.name}) に {creditResult.added} クレジットを付与しました（残高: {creditResult.remaining}）
              </span>
            )}
          </div>
        )}
      </div>

      {/* Test Credits */}
      <div className="admin-section">
        <h2>Test Mode</h2>
        <button className="admin-btn" onClick={grantTestCredits}>Grant 10 Test Credits</button>
        {testResult && (
          <div className="admin-test-result">
            <p>Token: <code>{testResult.adminToken}</code></p>
            <p>Credits: {testResult.creditsRemaining}</p>
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
    </div>
  );
}
