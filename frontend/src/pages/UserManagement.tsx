import { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle2, Trash2, ShieldAlert } from 'lucide-react';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import { getUsers, updateUserStatus, updateUserRole, deleteUser } from '../services/adminApi';
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <AdminSidebar user={currentUser} onLogout={onLogout} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {isSuperAdmin
                ? 'Full control: suspend, change roles, or delete any account.'
                : 'Suspend or reactivate buyer and seller accounts.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
              {isSuperAdmin && <option value="super_admin">Super Admins</option>}
            </select>
            <button
              onClick={() => fetchUsers(1)}
              className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold">User</th>
                      <th className="text-left px-5 py-3 font-semibold">Role</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      <th className="text-right px-5 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
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
