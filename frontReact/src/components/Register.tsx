import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { useAuth } from '../context/AuthContext';
import * as usuarioService from '../services/usuarioService';

/**
 * Equivalente a register.component (Angular). Se usa en:
 *  - /register            (registro de cliente, vía GuestRoute)
 *  - /admin/crear-empleado (alta de empleado, vía ProtectedRoute roles=['admin'])
 * El caso se distingue por la URL, igual que el original (router.url.startsWith).
 *
 * Nota: el original tenía `loading` y `successMessage` que el template no renderiza
 * (código muerto); se omiten. Comportamiento observable idéntico.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminCreatingEmployee = location.pathname.startsWith('/admin/crear-empleado');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreTouched, setNombreTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const nombreInvalid = nombre === '';
  const emailRequiredError = email === '';
  const emailFormatError = email !== '' && !EMAIL_PATTERN.test(email);
  const emailInvalid = emailRequiredError || emailFormatError;
  const passwordInvalid = password === '';
  const formInvalid = nombreInvalid || emailInvalid || passwordInvalid;

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formInvalid) return;

    setErrorMessage('');

    try {
      if (isAdminCreatingEmployee) {
        // Alta de empleado por el endpoint admin (el backend fija rol='empleado').
        await usuarioService.createEmpleado({ nombre, email, password });
      } else {
        // Registro público: el backend siempre crea un cliente.
        await register({ nombre, email, password });
      }
      setNombre('');
      setEmail('');
      setPassword('');
      setNombreTouched(false);
      setEmailTouched(false);
      setPasswordTouched(false);
      if (!isAdminCreatingEmployee) {
        navigate('/login?registrado=true');
      } else {
        navigate('/admin?registrado=true');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar usuario');
    }
  };

  return (
    <div className="flex justify-center min-h-screen items-start">
      <div className="bg-gray-100 p-8 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-6 text-center">
          {isAdminCreatingEmployee ? 'Registrar Empleado' : 'Registro de Usuario'}
        </h2>

        {isAdminCreatingEmployee && (
          <p className="text-sm text-gray-600 text-center mb-4">
            Completá los datos para dar de alta un nuevo empleado.
          </p>
        )}

        <form onSubmit={onRegister}>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Nombre</label>
            <InputText
              type="text"
              className="w-full"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => setNombreTouched(true)}
            />
            {nombreInvalid && nombreTouched && (
              <small className="text-red-500 mt-2">El nombre es obligatorio.</small>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Email</label>
            <InputText
              type="email"
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
            {emailInvalid && emailTouched && (
              <small className="text-red-500 mt-2">
                {emailRequiredError ? 'El email es obligatorio.' : 'El email no es válido.'}
              </small>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-medium">Contraseña</label>
            <Password
              className="w-full"
              inputClassName="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
            />
            {passwordInvalid && passwordTouched && (
              <small className="text-red-500 mt-2">La contraseña es obligatoria.</small>
            )}
          </div>

          <div className="mb-2">{errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}</div>

          <Button
            type="submit"
            label={isAdminCreatingEmployee ? 'Registrar Empleado' : 'Registrarse'}
            className="w-full"
          />
        </form>

        {!isAdminCreatingEmployee && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tenés una cuenta?{' '}
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                Ingresa acá
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
