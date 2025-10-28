import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "@/lib/auth";
import {
  Flame,
  Calendar,
  TrendingUp,
  User,
  LogOut,
  Dumbbell,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  userName?: string;
}

export default function Layout({
  children,
  userName = "Usuário",
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const displayName =
    userName && userName !== "Usuário" ? userName : "GymStreak";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navigationItems = [
    { path: "/", label: "Treino", icon: Flame },
    { path: "/schedule", label: "Programação", icon: Dumbbell },
    { path: "/calendar", label: "Calendário", icon: Calendar },
    { path: "/evolution", label: "Evolução", icon: TrendingUp },
    { path: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-sidebar text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <button
          onClick={handleLogout}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
          title="Sair"
        >
          <LogOut size={24} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-sidebar text-white p-8 min-h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-bold">GymStreak</h1>
          {userName && userName !== "Usuário" && (
            <p className="text-sidebar-foreground text-sm mt-2 opacity-80">
              Bem-vindo, {userName}!
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive
                    ? "bg-white/30 bg-white text-primary"
                    : "text-white hover:bg-white/20"
                }`}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all w-full text-white"
        >
          <LogOut size={24} />
          <span>Sair</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around fixed bottom-0 left-0 right-0 z-50">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-3 px-2 flex-1 transition-all ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
