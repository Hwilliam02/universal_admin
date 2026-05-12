import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, CheckCircle2, XCircle, AlertCircle, Trash2, Calendar, MoreVertical, RotateCcw } from 'lucide-react';
import type { User } from '@/types';
import { getCompanyUsers, updateUserStatus, restoreUser } from '@/api/userApi';

interface CompanyUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

export default function CompanyUsersDialog({ 
  open, 
  onOpenChange, 
  companyId, 
  companyName 
}: CompanyUsersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      // Call API to update user status
      const response = await updateUserStatus(userId, newStatus);
      
      if (response.status === 'success' || response.status === true) {
        // Update local state only after successful API call
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
        
        toast({
          title: 'Status Updated',
          description: `User status changed to ${newStatus}`,
          variant: 'success',
        });
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (userId: string) => {
    setRestoringId(userId);
    try {
      const response = await restoreUser(userId);
      if (response.status === 'success' || response.status === true) {
        await fetchUsers();
        toast({
          title: 'User Restored',
          description: 'User has been restored.',
          variant: 'success',
        });
      } else {
        throw new Error(response.message || 'Failed to restore user');
      }
    } catch (error) {
      console.error('Failed to restore user:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRestoringId(null);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCompanyUsers(companyId);
      if (response.status) {
        setUsers(response.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch company users',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch company users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    if (open && companyId) {
      fetchUsers();
    }
  }, [open, companyId, fetchUsers]);

  const filteredUsers = users.filter((user) =>
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusVariant = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (user: User) => {
    if (user.is_deleted) {
      return <Trash2 className="h-3 w-3 mr-1 text-red-500" />;
    }
    switch (user.status) {
      case 'active':
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'inactive':
        return <XCircle className="h-3 w-3 mr-1" />;
      case 'suspended':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getDisplayStatus = (user: User) => {
    if (user.is_deleted) return 'deleted';
    return user.status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusCount = (status: string) => {
    if (status === 'deleted') {
      return users.filter(u => u.is_deleted).length;
    }
    return users.filter(u => !u.is_deleted && u.status === status).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-blue-600" />
            Users in {companyName}
          </DialogTitle>
          <DialogDescription>
            Manage all users belonging to this company • {users.length} total users
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-600">Active</p>
                <p className="text-lg font-bold text-green-700">{getStatusCount('active')}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-xs font-medium text-gray-600">Inactive</p>
                <p className="text-lg font-bold text-gray-700">{getStatusCount('inactive')}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs font-medium text-yellow-600">Suspended</p>
                <p className="text-lg font-bold text-yellow-700">{getStatusCount('suspended')}</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        {searchQuery ? 'No users found' : 'No users in this company'}
                      </p>
                      {searchQuery && (
                        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow 
                    key={user._id} 
                    className={`hover:bg-blue-50/50 transition-colors ${user.is_deleted ? 'opacity-60 bg-red-50' : ''}`}
                  >
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.role.map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.is_deleted ? 'destructive' : getStatusVariant(user.status)} 
                        className="font-medium"
                      >
                        {getStatusIcon(user)}
                        {getDisplayStatus(user)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.is_deleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(user._id)}
                          disabled={restoringId === user._id}
                          className="h-8 px-3 bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                          title="Restore User"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {restoringId === user._id ? 'Restoring...' : 'Restore'}
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user._id, 'active')}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Set Active
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'inactive' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user._id, 'inactive')}>
                                <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                                Set Inactive
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'suspended' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user._id, 'suspended')}>
                                <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
