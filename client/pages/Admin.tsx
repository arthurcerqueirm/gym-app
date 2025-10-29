import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagementModal } from "@/components/UserManagementModal";
import { supabase } from "@/lib/supabase";
import { isUserAdmin, getAllUsers, getUserCount, canDeleteUser } from "@/lib/admin";
import { toast } from "sonner";
import {
  Trash2,
  Shield,
  ShieldOff,
  Plus,
  Users,
  Lock,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Check if current user is admin
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData?.session?.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const admin = await isUserAdmin(userId);
      setIsAdmin(admin);

      if (!admin) {
        setLoading(false);
        return;
      }

      // Get current user email
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userData) {
        setCurrentUserEmail(userData.email);
      }

      // Load users and count
      const { data: usersData } = await getAllUsers();
      setUsers(usersData || []);

      const count = await getUserCount();
      setUserCount(count);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const canDelete = await canDeleteUser(
      selectedUser.id,
      currentUserEmail,
    );
    if (!canDelete) {
      toast.error("Não é possível deletar o dono do sistema");
      setDeleteConfirm(false);
      return;
    }

    try {
      // Delete user from users table
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", selectedUser.id);

      if (deleteError) throw deleteError;

      // Delete auth user using admin API would require service key
      // For now, we'll just remove from users table
      toast.success(`Usuário ${selectedUser.email} removido com sucesso`);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao deletar usuário");
    }
  };

  const handleToggleAdmin = async (user: User) => {
    if (user.email === "arthurcerqueira2025@gmail.com") {
      toast.error("Não é possível remover permissão de admin do dono");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_admin: !user.is_admin })
        .eq("id", user.id);

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, is_admin: !u.is_admin } : u,
        ),
      );

      toast.success(
        `${user.email} é agora ${!user.is_admin ? "administrador" : "usuário comum"}`,
      );
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast.error("Erro ao atualizar permissão");
    }
  };

  const handleChangePassword = async () => {
    if (!passwordModalUser || !newPassword) return;

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        passwordModalUser.id,
        { password: newPassword },
      );

      if (error) throw error;

      toast.success("Senha alterada com sucesso");
      setPasswordModalUser(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Erro ao alterar senha. Verifique se você tem permissão de admin no Supabase.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Painel de Administração
          </h1>
          <p className="text-gray-600">
            Gerencie usuários e permissões do sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {userCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">
                Administradores
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {users.filter((u) => u.is_admin).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuários do Sistema</CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Cadastrado em</TableHead>
                    <TableHead className="font-semibold text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.email === "arthurcerqueira2025@gmail.com" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Dono
                          </span>
                        ) : user.is_admin ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Usuário
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {user.email !== "arthurcerqueira2025@gmail.com" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleToggleAdmin(user)
                                }
                                title={
                                  user.is_admin
                                    ? "Remover admin"
                                    : "Tornar admin"
                                }
                              >
                                {user.is_admin ? (
                                  <ShieldOff className="w-4 h-4" />
                                ) : (
                                  <Shield className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPasswordModalUser(user)}
                                title="Alterar senha"
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteConfirm(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <UserManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={loadAdminData}
      />

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário{" "}
              <strong>{selectedUser?.email}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {passwordModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">
              Alterar Senha - {passwordModalUser.name}
            </h2>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha (mínimo 6 caracteres)"
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordModalUser(null);
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading || !newPassword}
                className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
              >
                {passwordLoading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
