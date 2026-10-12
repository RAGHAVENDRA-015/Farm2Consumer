import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useToast } from '../../contexts/ToastContext';
import { User, Role } from '../../types';
import { Badge } from '../../components/common/Badge';

export const AdminCustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getCustomers(),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.updateUserStatus(userId, isActive),
    onSuccess: (updated) => {
      success(`User ${updated.isActive ? 'activated' : 'deactivated'}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => error(err.message || 'Status update failed'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: (updated) => {
      success(`User role updated to ${updated.role}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => error(err.message || 'Role update failed'),
  });

  const usersList: User[] = Array.isArray(users) ? users : (users as any)?.items || [];

  const filtered = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-darkText">User & Customer Directory</h1>
        <p className="text-xs text-grayText">Manage accounts, security status, and system roles</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-gray-50 text-xs pl-8 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 text-grayText absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs text-grayText font-medium">
          Total Users: <span className="font-bold text-darkText">{users.length}</span>
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-subtle">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold text-grayText uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-darkText">{u.name}</span>
                        <p className="text-[10px] text-grayText">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-grayText">{u.email || u.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({
                            userId: u.id,
                            role: e.target.value as Role,
                          })
                        }
                        className="bg-gray-50 border border-gray-200 text-xs rounded-lg px-2 py-1 font-semibold text-darkText outline-none focus:border-primary"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="FARMER">FARMER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.isActive ? 'green' : 'red'} size="sm">
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            userId: u.id,
                            isActive: !u.isActive,
                          })
                        }
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                          u.isActive
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-primary-700 border-primary-200 hover:bg-primary-50'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-grayText">No users found.</div>
        )}
      </div>
    </div>
  );
};
