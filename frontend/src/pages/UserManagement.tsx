import { useState, useEffect, type FormEvent } from 'react';
import { Search, Ban, CheckCircle2, Trash2, ShieldAlert, UserPlus } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import { createAdminAccount, getUsers, updateUserStatus, updateUserRole, deleteUser } from '../services/adminApi';
import type { AdminUserRecord } from '../services/adminApi';
import type { User } from '../types';

interface UserManagementProps {
  user: User;
  onLogout: () => void;
}

const roleColor: Record<string, string> = {
  buyer: 'text-teal-700 bg-teal-50',
  seller: 'text-sky-700 bg-sky-50',
  admin: 'text-amber-700 bg-amber-50',
  super_admin: 'text-purple-700 bg-purple-50',
};

const UserManagement = ({ user: currentUser, onLogout }: UserManagementProps) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [adminCreatedMessage, setAdminCreatedMessage] = useState('');

  const fetchUsers = async (p = 1) => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await getUsers({ search: search || undefined, role: roleFilter, page: p, limit: 20 });
      setUsers(response.users);
      setPage(response.page);
      setPages(response.pages);
    } catch (error) {
      console.error('Failed to load users', error);
      setUsers([]);
      setLoadError('Could not load users right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleToggleStatus = async (target: AdminUserRecord) => {
    setActionError('');
    setPendingId(target._id);
    try {
      const newStatus = target.accountStatus === 'active' ? 'suspended' : 'active';
      await updateUserStatus(target._id, newStatus);
      await fetchUsers(page);
    } catch (error: any) {
      console.error('Failed to update status', error);
      setActionError(error?.response?.data?.message || 'Failed to update account status.');
    } finally {
      setPendingId('');
    }
  };

  const handleRoleChange = async (target: AdminUserRecord, newRole: string) => {
    if (newRole === target.role) return;
    setActionError('');
    setPendingId(target._id);
    try {
      await updateUserRole(target._id, newRole);
      await fetchUsers(page);
    } catch (error: any) {
      console.error('Failed to change role', error);
      setActionError(error?.response?.data?.message || 'Failed to change user role.');
    } finally {
      setPendingId('');
    }
  };

  const handleDelete = async (target: AdminUserRecord) => {
    if (!window.confirm(`Permanently delete ${target.name}'s account? This cannot be undone.`)) return;
    setActionError('');
    setPendingId(target._id);
    try {
      await deleteUser(target._id);
      await fetchUsers(page);
    } catch (error: any) {
      console.error('Failed to delete user', error);
      setActionError(error?.response?.data?.message || 'Failed to delete user.');
    } finally {
      setPendingId('');
    }
  };

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError('');
    setAdminCreatedMessage('');
    setPendingId('new-admin');
    try {
      await createAdminAccount(adminForm);
      setAdminForm({ name: '', email: '', password: '' });
      setShowAdminForm(false);
      setAdminCreatedMessage('Admin account created. Share the initial password securely.');
      setRoleFilter('admin');
      if (roleFilter === 'admin') await fetchUsers(1);
    } catch (error: any) {
      setActionError(error?.response?.data?.message || 'Could not create the admin account.');
    } finally {
      setPendingId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-violet-50/40 font-sans">
      <AdminSidebar user={currentUser} onLogout={onLogout} />

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className={`rounded-3xl bg-gradient-to-r ${isSuperAdmin ? 'from-violet-700 via-indigo-600 to-sky-600' : 'from-teal-700 via-cyan-600 to-sky-600'} p-6 text-white shadow-lg`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">{isSuperAdmin ? 'Platform administration' : 'Account support'}</p>
            <h1 className="mt-2 text-3xl font-extrabold">{isSuperAdmin ? 'People & Roles' : 'Buyers & Sellers'}</h1>
            <p className="mt-2 text-sm text-white/85">
              {isSuperAdmin
                ? 'Platform control: create admins, manage roles, and oversee all accounts.'
                : 'Suspend or reactivate buyer and seller accounts.'}
            </p>
          </header>

          {isSuperAdmin && (
            <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-sky-50 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Super admin control</p>
                  <h2 className="mt-1 font-bold text-slate-900">Admin accounts</h2>
                  <p className="mt-1 text-sm text-slate-500">Create operational admins. Only super admins can grant privileged roles.</p>
                </div>
                <button type="button" onClick={() => setShowAdminForm((open) => !open)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">
                  <UserPlus className="h-4 w-4" /> {showAdminForm ? 'Close form' : 'Create admin'}
                </button>
              </div>
              {showAdminForm && (
                <form onSubmit={handleCreateAdmin} className="grid gap-3 border-t border-violet-100 bg-white/80 p-5 sm:grid-cols-2">
                  <input required maxLength={100} value={adminForm.name} onChange={(event) => setAdminForm((form) => ({ ...form, name: event.target.value }))} placeholder="Admin full name" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <input required type="email" value={adminForm.email} onChange={(event) => setAdminForm((form) => ({ ...form, email: event.target.value }))} placeholder="Admin email" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <input required minLength={8} type="password" autoComplete="new-password" value={adminForm.password} onChange={(event) => setAdminForm((form) => ({ ...form, password: event.target.value }))} placeholder="Initial password (8+ characters)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  <button type="submit" disabled={pendingId === 'new-admin'} className="rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pendingId === 'new-admin' ? 'Creating account…' : 'Create admin account'}</button>
                </form>
              )}
            </section>
          )}

          {adminCreatedMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{adminCreatedMessage}</div>}

          <div className="flex flex-col gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              {isSuperAdmin && <option value="admin">Admins</option>}
              {isSuperAdmin && <option value="super_admin">Super Admins</option>}
            </select>
            <button
              onClick={() => fetchUsers(1)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md ${isSuperAdmin ? 'bg-violet-600 hover:bg-violet-700' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              Search
            </button>
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {actionError}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-16 text-center">
              <p className="text-red-600 mb-4">{loadError}</p>
              <button onClick={() => fetchUsers(1)} className="text-rose-600 hover:text-rose-700 font-medium">Try again</button>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
              <p className="text-gray-500">No users match your search.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-white bg-white shadow-sm ring-1 ring-slate-100">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className={`text-xs uppercase text-slate-600 ${isSuperAdmin ? 'bg-violet-50' : 'bg-teal-50'}`}>
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold">User</th>
                      <th className="text-left px-5 py-3 font-semibold">Role</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      <th className="text-right px-5 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isSelf = u._id === currentUser._id;
                      const isTargetSuperAdmin = u.role === 'super_admin';
                      const canModerate = isSuperAdmin || (['buyer', 'seller'].includes(u.role) && !isTargetSuperAdmin);
                      return (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </td>
                          <td className="px-5 py-3">
                            {isSuperAdmin ? (
                              <select
                                value={u.role}
                                disabled={isSelf || pendingId === u._id}
                                onChange={(e) => handleRoleChange(u, e.target.value)}
                                className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${roleColor[u.role] || 'text-gray-600 bg-gray-50'}`}
                              >
                                <option value="buyer">buyer</option>
                                <option value="seller">seller</option>
                                <option value="admin">admin</option>
                                <option value="super_admin">super_admin</option>
                              </select>
                            ) : (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColor[u.role] || 'text-gray-600 bg-gray-50'}`}>
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.accountStatus === 'active' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {canModerate && !isSelf && !isTargetSuperAdmin && (
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={pendingId === u._id}
                                  title={u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                  {u.accountStatus === 'active' ? (
                                    <Ban className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  )}
                                </button>
                              )}
                              {isSuperAdmin && !isSelf && (
                                <button
                                  onClick={() => handleDelete(u)}
                                  disabled={pendingId === u._id}
                                  title="Delete account"
                                  className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                              {isSelf && <span className="text-xs text-gray-400">You</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => fetchUsers(page - 1)} disabled={page <= 1} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                  <button onClick={() => fetchUsers(page + 1)} disabled={page >= pages} className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
