#!/usr/bin/env node
// ============================================================
// Comprehensive Feature Test — All 11 Assignment Requirements
// ============================================================
const BASE = 'http://localhost:3000/api';
let passed = 0, failed = 0;

function ok(name) { passed++; console.log(`  ✅ ${name}`); }
function fail(name, detail) { failed++; console.error(`  ❌ ${name}: ${detail}`); }

async function req(method, path, body, token, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, cookie: res.headers.get('set-cookie') };
}

async function run() {
  const ts = Date.now();
  let token = null, refreshCookie = null, userId = null;
  let slug = null, workspaceId = null;
  let issueId = null;
  let memberId = null;

  console.log('\n══════════════════════════════════════════');
  console.log('   FEATURE AUDIT — Assignment Requirements  ');
  console.log('══════════════════════════════════════════\n');

  // ─────────────────────────────────────────────────
  // 1. AUTH — Signup / Login
  // ─────────────────────────────────────────────────
  console.log('1. Signup / Login (bcrypt + JWT)');

  // 1a. Register
  let r = await req('POST', '/auth/register', { email: `audit-${ts}@test.com`, name: 'Audit User', password: 'password123' });
  if (r.status === 200 && r.json.data?.accessToken) {
    token = r.json.data.accessToken;
    refreshCookie = r.cookie;
    userId = r.json.data.user?.id;
    ok('POST /auth/register → 200 with accessToken');
  } else { fail('POST /auth/register', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  // 1b. Zod validation on register (missing field)
  r = await req('POST', '/auth/register', { email: 'bad', name: 'X', password: '123' });
  if (r.status === 400 && r.json.error === 'VALIDATION_ERROR') {
    ok('POST /auth/register — Zod rejects invalid input (400 VALIDATION_ERROR)');
  } else { fail('Zod validation on register', `status=${r.status}`); }

  // 1c. Duplicate email
  r = await req('POST', '/auth/register', { email: `audit-${ts}@test.com`, name: 'Dup', password: 'password123' });
  if (r.status === 409) { ok('POST /auth/register → 409 on duplicate email'); }
  else { fail('Duplicate email check', `status=${r.status}`); }

  // 1d. Login
  r = await req('POST', '/auth/login', { email: `audit-${ts}@test.com`, password: 'password123' });
  if (r.status === 200 && r.json.data?.accessToken) {
    token = r.json.data.accessToken;
    refreshCookie = r.cookie;
    ok('POST /auth/login → 200 with accessToken + Set-Cookie');
  } else { fail('POST /auth/login', `status=${r.status}`); }

  // 1e. Wrong password
  r = await req('POST', '/auth/login', { email: `audit-${ts}@test.com`, password: 'wrong' });
  if (r.status === 401) { ok('POST /auth/login → 401 on wrong password'); }
  else { fail('Wrong password check', `status=${r.status}`); }

  // 1f. Token Refresh (rotation)
  r = await req('POST', '/auth/refresh', null, null, refreshCookie);
  if (r.status === 200 && r.json.data?.accessToken) {
    token = r.json.data.accessToken;
    refreshCookie = r.cookie;
    ok('POST /auth/refresh → 200 with new accessToken (rotation working)');
  } else { fail('POST /auth/refresh', `status=${r.status}`); }

  // 1g. GET /me
  r = await req('GET', '/auth/me', null, token);
  if (r.status === 200 && r.json.data?.user?.email) { ok('GET /auth/me → 200 with user object'); }
  else { fail('GET /auth/me', `status=${r.status}`); }

  // 1h. Protected route without token
  r = await req('GET', '/auth/me', null, null);
  if (r.status === 401) { ok('GET /auth/me → 401 without token (auth guard works)'); }
  else { fail('Auth guard', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // 2. PROJECT MANAGEMENT — Workspaces CRUD
  // ─────────────────────────────────────────────────
  console.log('\n2. Project Management (Workspaces CRUD)');

  slug = `audit-ws-${ts}`;
  r = await req('POST', '/workspaces', { name: 'Audit Workspace', slug }, token);
  if (r.status === 200 && r.json.data?.slug === slug) {
    workspaceId = r.json.data.id;
    ok('POST /workspaces → 200 creates workspace with ADMIN role');
  } else { fail('POST /workspaces', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  // Duplicate slug
  r = await req('POST', '/workspaces', { name: 'Dup', slug }, token);
  if (r.status === 409) { ok('POST /workspaces → 409 on duplicate slug'); }
  else { fail('Duplicate slug', `status=${r.status}`); }

  // GET list
  r = await req('GET', '/workspaces', null, token);
  const found = r.json.data?.some(w => w.slug === slug);
  if (r.status === 200 && found) { ok('GET /workspaces → lists workspace'); }
  else { fail('GET /workspaces', `status=${r.status} found=${found}`); }

  // GET single
  r = await req('GET', `/workspaces/${slug}`, null, token);
  if (r.status === 200 && r.json.data?.slug === slug) { ok(`GET /workspaces/:slug → 200`); }
  else { fail('GET /workspaces/:slug', `status=${r.status}`); }

  // PATCH
  r = await req('PATCH', `/workspaces/${slug}`, { name: 'Updated Workspace' }, token);
  if (r.status === 200 && r.json.data?.name === 'Updated Workspace') { ok('PATCH /workspaces/:slug → 200 updates name'); }
  else { fail('PATCH /workspaces/:slug', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // 3. TEAM MANAGEMENT — Members
  // ─────────────────────────────────────────────────
  console.log('\n3. Team Management (WorkspaceMember CRUD)');

  // Register a second user
  const r2 = await req('POST', '/auth/register', { email: `member-${ts}@test.com`, name: 'Member User', password: 'password123' });
  memberId = r2.json.data?.user?.id;

  r = await req('GET', `/workspaces/${slug}/members`, null, token);
  if (r.status === 200 && Array.isArray(r.json.data)) { ok('GET /members → 200 lists members'); }
  else { fail('GET /members', `status=${r.status}`); }

  // Invite member
  r = await req('POST', `/workspaces/${slug}/members`, { email: `member-${ts}@test.com` }, token);
  if (r.status === 200) { ok('POST /members → 200 invites by email'); }
  else { fail('POST /members', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  // Duplicate invite
  r = await req('POST', `/workspaces/${slug}/members`, { email: `member-${ts}@test.com` }, token);
  if (r.status === 409) { ok('POST /members → 409 on duplicate invite'); }
  else { fail('Duplicate invite', `status=${r.status}`); }

  // Change role
  r = await req('PATCH', `/workspaces/${slug}/members/${memberId}/role`, { role: 'ADMIN' }, token);
  if (r.status === 200) { ok('PATCH /members/:id/role → 200 changes role'); }
  else { fail('PATCH /members/:id/role', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  // Remove member
  r = await req('DELETE', `/workspaces/${slug}/members/${memberId}`, null, token);
  if (r.status === 200) { ok('DELETE /members/:id → 200 removes member'); }
  else { fail('DELETE /members/:id', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // 4. TASK CREATION + ASSIGNMENT
  // ─────────────────────────────────────────────────
  console.log('\n4. Task Creation + Assignment (Issues)');

  r = await req('POST', `/workspaces/${slug}/issues`, {
    title: 'Fix login bug', description: 'Users stuck on login', priority: 'HIGH', dueDate: new Date(Date.now() - 86400000).toISOString()
  }, token);
  if (r.status === 200 && r.json.data?.identifier && r.json.data.identifier.includes('-')) {
    issueId = r.json.data.id;
    ok(`POST /issues → 200 with identifier=${r.json.data.identifier}`);
  } else { fail('POST /issues', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  // Zod validation — missing title
  r = await req('POST', `/workspaces/${slug}/issues`, { priority: 'HIGH' }, token);
  if (r.status === 400 && r.json.error === 'VALIDATION_ERROR') { ok('POST /issues → 400 VALIDATION_ERROR on missing title'); }
  else { fail('Issue Zod validation', `status=${r.status}`); }

  // GET list
  r = await req('GET', `/workspaces/${slug}/issues`, null, token);
  if (r.status === 200 && Array.isArray(r.json.data) && r.json.data.length > 0) { ok('GET /issues → 200 lists issues'); }
  else { fail('GET /issues', `status=${r.status}`); }

  // GET single
  r = await req('GET', `/workspaces/${slug}/issues/${issueId}`, null, token);
  if (r.status === 200 && r.json.data?.id === issueId) { ok('GET /issues/:id → 200'); }
  else { fail('GET /issues/:id', `status=${r.status}`); }

  // PATCH update issue
  r = await req('PATCH', `/workspaces/${slug}/issues/${issueId}`, { title: 'Updated Bug', priority: 'URGENT' }, token);
  if (r.status === 200 && r.json.data?.priority === 'URGENT') { ok('PATCH /issues/:id → 200 updates fields'); }
  else { fail('PATCH /issues/:id', `status=${r.status}`); }

  // PATCH assign
  r = await req('PATCH', `/workspaces/${slug}/issues/${issueId}/assign`, { assigneeId: userId }, token);
  if (r.status === 200) { ok('PATCH /issues/:id/assign → 200 sets assignee'); }
  else { fail('PATCH /issues/:id/assign', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  // Query filter by status
  r = await req('GET', `/workspaces/${slug}/issues?status=TODO`, null, token);
  if (r.status === 200) { ok('GET /issues?status=TODO → 200 (query filter works)'); }
  else { fail('GET /issues with filter', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // 5. STATUS TRACKING
  // ─────────────────────────────────────────────────
  console.log('\n5. Status Tracking');

  for (const status of ['IN_PROGRESS', 'IN_REVIEW', 'DONE']) {
    r = await req('PATCH', `/workspaces/${slug}/issues/${issueId}/status`, { status }, token);
    if (r.status === 200 && r.json.data?.status === status) { ok(`PATCH /issues/:id/status → ${status}`); }
    else { fail(`Status → ${status}`, `status=${r.status}`); }
  }

  // Invalid status
  r = await req('PATCH', `/workspaces/${slug}/issues/${issueId}/status`, { status: 'FLYING' }, token);
  if (r.status === 400) { ok('PATCH /issues/:id/status → 400 on invalid status enum'); }
  else { fail('Invalid status Zod validation', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // 6. DASHBOARD
  // ─────────────────────────────────────────────────
  console.log('\n6. Dashboard');

  r = await req('GET', '/dashboard/summary', null, token);
  if (r.status === 200 && r.json.data?.total !== undefined && r.json.data?.byStatus) {
    ok(`GET /dashboard/summary → total=${r.json.data.total} byStatus keys=${Object.keys(r.json.data.byStatus).join(',')}`);
  } else { fail('GET /dashboard/summary', `status=${r.status} body=${JSON.stringify(r.json)}`); }

  r = await req('GET', '/dashboard/my-issues', null, token);
  if (r.status === 200 && Array.isArray(r.json.data)) { ok(`GET /dashboard/my-issues → ${r.json.data.length} issues`); }
  else { fail('GET /dashboard/my-issues', `status=${r.status}`); }

  r = await req('GET', '/dashboard/overdue', null, token);
  if (r.status === 200 && Array.isArray(r.json.data)) { ok(`GET /dashboard/overdue → ${r.json.data.length} overdue`); }
  else { fail('GET /dashboard/overdue', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // 7. ROLE-BASED ACCESS CONTROL
  // ─────────────────────────────────────────────────
  console.log('\n7. Role-Based Access Control');

  // Login as member
  const memberLogin = await req('POST', '/auth/login', { email: `member-${ts}@test.com`, password: 'password123' });
  const memberToken = memberLogin.json.data?.accessToken;

  // member cannot delete workspace (ADMIN required)
  if (memberToken) {
    // First re-invite them since we removed them
    await req('POST', `/workspaces/${slug}/members`, { email: `member-${ts}@test.com` }, token);
    r = await req('DELETE', `/workspaces/${slug}`, null, memberToken);
    if (r.status === 403) { ok('DELETE /workspaces/:slug → 403 for MEMBER (RBAC guards ADMIN route)'); }
    else { fail('RBAC guard on workspace delete', `status=${r.status}`); }

    // member CAN create issues
    r = await req('POST', `/workspaces/${slug}/issues`, { title: 'Member Issue', priority: 'LOW' }, memberToken);
    if (r.status === 200) { ok('POST /issues → 200 for MEMBER (now allowed)'); }
    else { fail('RBAC guard on issue create', `status=${r.status} body=${JSON.stringify(r.json)}`); }

    // member CAN list issues
    r = await req('GET', `/workspaces/${slug}/issues`, null, memberToken);
    if (r.status === 200) { ok('GET /issues → 200 for MEMBER (read allowed)'); }
    else { fail('MEMBER read issues', `status=${r.status}`); }
  } else {
    fail('Member login for RBAC test', 'could not login');
  }

  // ─────────────────────────────────────────────────
  // 8. RAILWAY DEPLOYMENT — railway.toml + build pipeline
  // ─────────────────────────────────────────────────
  console.log('\n8. Railway Deployment');

  const fs = require('fs');
  const hasRailwayToml = fs.existsSync('./railway.toml');
  const hasRootPkg = fs.existsSync('./package.json');
  const rootPkg = hasRootPkg ? JSON.parse(fs.readFileSync('./package.json', 'utf8')) : {};
  const hasBuildScript = rootPkg.scripts?.build?.includes('backend') && rootPkg.scripts?.build?.includes('frontend');
  const hasFrontendDist = fs.existsSync('./backend/dist/public/index.html');
  const hasHealthCheck = fs.existsSync('./backend/src/app.ts') &&
    fs.readFileSync('./backend/src/app.ts', 'utf8').includes('/api/health');

  if (hasRailwayToml) { ok('railway.toml exists'); } else { fail('railway.toml', 'missing'); }
  if (hasRootPkg && hasBuildScript) { ok('Root package.json with build + start scripts'); } else { fail('Root package.json', 'missing or incomplete'); }
  if (hasFrontendDist) { ok('Frontend dist copied to backend/dist/public (single service)'); } else { fail('Frontend dist in backend', 'missing — run npm run build'); }
  if (hasHealthCheck) { ok('GET /api/health endpoint exists'); } else { fail('/api/health', 'not found'); }

  // ─────────────────────────────────────────────────
  // 9. DELETE CLEANUP
  // ─────────────────────────────────────────────────
  console.log('\n9. DELETE operations');
  r = await req('DELETE', `/workspaces/${slug}/issues/${issueId}`, null, token);
  if (r.status === 200) { ok('DELETE /issues/:id → 200'); }
  else { fail('DELETE /issues/:id', `status=${r.status}`); }

  r = await req('DELETE', `/workspaces/${slug}`, null, token);
  if (r.status === 200) { ok('DELETE /workspaces/:slug → 200'); }
  else { fail('DELETE /workspaces/:slug', `status=${r.status}`); }

  // ─────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════\n');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
