import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <AlertCircle size={64} className="mx-auto mb-6 text-primary" />
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-2xl font-bold text-gray-800 mb-2">
          Página não encontrada
        </p>
        <p className="text-gray-600 mb-8">
          Desculpe, a página que você está procurando não existe. Parece que
          você saiu do caminho.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 btn-gradient text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <ArrowLeft size={20} />
          Voltar para Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
