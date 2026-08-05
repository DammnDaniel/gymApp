import Link from "next/link";
import { AuthFrame } from "@/components/AuthFrame";

export default function RegisterPage() {
  return (
    <AuthFrame eyebrow="Acceso" title={<>Registro<br />cerrado.</>} description="Esta app es privada y las cuentas ya están creadas. Si necesitas acceso, habla con el administrador.">
      <Link
        href="/login"
        className="button-primary w-full"
      >
        Iniciar sesión <span aria-hidden>→</span>
      </Link>
    </AuthFrame>
  );
}
