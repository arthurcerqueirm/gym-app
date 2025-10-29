import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export function UserManagementModal({
  isOpen,
  onClose,
  onUserCreated,
}: UserManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    isAdmin: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) {
        toast.error(
          authError.message || "Erro ao criar usuário de autenticação",
        );
        return;
      }

      if (!authData.user) {
        toast.error("Erro ao criar usuário");
        return;
      }

      // Create user record in users table
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          is_admin: formData.isAdmin,
        },
      ]);

      if (insertError) {
        toast.error(insertError.message || "Erro ao criar usuário no banco");
        return;
      }

      toast.success(`Usuário ${formData.email} criado com sucesso!`);
      setFormData({ email: "", password: "", name: "", isAdmin: false });
      onClose();
      onUserCreated?.();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Erro inesperado ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo usuário ao sistema. O usuário receberá um email de
            confirmação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="usuario@exemplo.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isAdmin"
              type="checkbox"
              checked={formData.isAdmin}
              onChange={(e) =>
                setFormData({ ...formData, isAdmin: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="isAdmin" className="cursor-pointer font-normal">
              Tornar administrador
            </Label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
