import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff } from "lucide-react";

type Status = "checking" | "ready" | "invalid";

const PasswordField = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" required className="pr-10" />
        <Button type="button" variant="ghost" size="icon" aria-label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show} className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShow(!show)}>
          {show ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
        </Button>
      </div>
    </div>
  );
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || query.get("error")) {
      setStatus("invalid");
      return;
    }
    const isRecovery = hash.get("type") === "recovery" || query.has("code");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecovery && session)) setStatus("ready");
    });

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setStatus((s) => (s === "ready" ? s : isRecovery && data.session ? "ready" : "invalid"));
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não coincidem");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Não foi possível redefinir a senha. O link pode ter expirado; solicite um novo.");
      setSaving(false);
      return;
    }
    await supabase.auth.signOut();
    toast.success("Senha redefinida! Entre com a nova senha.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><KeyRound className="w-10 h-10 text-primary" /></div>
          <CardTitle className="text-xl">Redefinir Senha</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "checking" && <p className="text-sm text-center text-muted-foreground">Validando link...</p>}
          {status === "invalid" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Este link é inválido ou expirou. Volte ao login e clique em "Esqueci minha senha" para receber um novo link.
              </p>
              <Button className="w-full" onClick={() => navigate("/login")}>Voltar ao login</Button>
            </div>
          )}
          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField id="resetPass" label="Nova senha" value={password} onChange={setPassword} />
              <PasswordField id="resetConfirm" label="Confirmar nova senha" value={confirm} onChange={setConfirm} />
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Salvando..." : "Salvar nova senha"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
