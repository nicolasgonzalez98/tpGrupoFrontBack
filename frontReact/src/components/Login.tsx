import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useAuth } from '../context/AuthContext';

/**
 * Equivalente a login.component (Angular).
 * Nota: el original tenía flags `loading` y `successMessage` que nunca se renderizan
 * (código muerto); se omiten. El comportamiento observable es idéntico.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRegisteredDialog, setShowRegisteredDialog] = useState(false);

  // Equivalente a la suscripción a queryParams: si viene ?registrado=true muestra el
  // diálogo y limpia el query param de la URL (como location.replaceState en Angular).
  useEffect(() => {
    if (searchParams.get('registrado') === 'true') {
      setShowRegisteredDialog(true);
      searchParams.delete('registrado');
      setSearchParams(searchParams, { replace: true });
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emailInvalid = email === '' || !EMAIL_PATTERN.test(email);
  const passwordInvalid = password === '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="flex justify-center min-h-screen items-start">
      <div className="bg-gray-100 p-8 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-6 text-center">Iniciar sesión</h2>

        <form onSubmit={onSubmit}>
          <div className="mb-2">
            <label className="block mb-2 font-medium">Email</label>
            <InputText
              className="w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
            {emailInvalid && emailTouched && <div className="text-red-500">Email inválido</div>}
          </div>

          <div className="mb-2">
            <label className="block mb-2 font-medium">Contraseña</label>
            <Password
              className="w-full"
              inputClassName="w-full"
              feedback={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
            />
            {passwordInvalid && passwordTouched && (
              <div className="text-red-500">Contraseña requerida</div>
            )}
          </div>

          <div className="mb-2">
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          </div>

          <Button type="submit" label="Iniciar sesión" />
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¿No tenés una cuenta?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-medium">
              Registrate acá
            </a>
          </p>
        </div>

        <Dialog
          header="¡Registro exitoso!"
          visible={showRegisteredDialog}
          modal
          dismissableMask
          onHide={() => setShowRegisteredDialog(false)}
          style={{ width: '300px' }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <i className="pi pi-check-circle text-green-500 text-5xl"></i>
            <p className="text-lg">Tu cuenta fue creada correctamente.</p>
            <p className="text-sm text-gray-600">Ahora podés iniciar sesión.</p>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
