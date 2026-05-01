const http = require('http');

async function measureLatency(name, fetchFn) {
  const start = process.hrtime.bigint();
  const res = await fetchFn();
  const end = process.hrtime.bigint();
  const latencyMs = Number(end - start) / 1000000;
  console.log(`[${name}] Latency: ${latencyMs.toFixed(2)} ms (Status: ${res.status})`);
  return res;
}

async function runTest() {
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";

  // 1. Register
  const regRes = await measureLatency('Auth - Register', () => fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name: "Test User", password })
  }));
  const regData = await regRes.json();
  const token = regData.data?.accessToken;
  const cookie = regRes.headers.get('set-cookie');

  if (!token) {
    console.error('Registration failed:', regData);
    return;
  }

  // 2. Refresh Token
  const refreshRes = await measureLatency('Auth - Refresh Token', () => fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Cookie': cookie }
  }));
  const refreshData = await refreshRes.json();
  const newToken = refreshData.data?.accessToken;

  // 3. Create Workspace
  const wsRes = await measureLatency('Workspaces - Create', () => fetch('http://localhost:3000/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
    body: JSON.stringify({ name: "Test Workspace", slug: `test-workspace-${Date.now()}` })
  }));
  const wsData = await wsRes.json();
  const slug = wsData.data?.slug;

  // 4. Create Issue
  const issueRes = await measureLatency('Issues - Create', () => fetch(`http://localhost:3000/api/workspaces/${slug}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
    body: JSON.stringify({ title: "Latency Test Issue", priority: "HIGH" })
  }));
  const issueData = await issueRes.json();
  const issueId = issueData.data?.id;

  // 5. Update Issue Status
  await measureLatency('Issues - Update Status', () => fetch(`http://localhost:3000/api/workspaces/${slug}/issues/${issueId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
    body: JSON.stringify({ status: "IN_PROGRESS" })
  }));

  // 6. Get Dashboard
  await measureLatency('Dashboard - Summary', () => fetch(`http://localhost:3000/api/dashboard/summary`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${newToken}` }
  }));

  console.log('\nAll tests completed successfully!');
}

runTest().catch(console.error);
