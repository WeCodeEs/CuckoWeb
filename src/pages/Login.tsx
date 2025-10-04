import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, error, loading, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'Administrador') {
        navigate('/dashboard');
      } else {
        navigate('/pedidos');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkbg flex flex-col items-center justify-center py-6 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-4">
        <img
          src="https://ctjfdevwmxtuhylpspih.supabase.co/storage/v1/object/public/product_images//Logo_Vertical__1_-removebg-preview.png"
          alt="CuckooEats Logo"
          className="h-[250px] w-auto mx-auto block dark:hidden"
        />
        <img
          src="https://ctjfdevwmxtuhylpspih.supabase.co/storage/v1/object/public/product_images//Fondo%20Obscuro.png"
          alt="CuckooEats Logo"
          className="h-[250px] w-auto mx-auto hidden dark:block"
        />

        <div className="bg-white dark:bg-darkbg-lighter py-8 px-4 shadow-soft dark:shadow-dark sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Correo Electrónico
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-darkbg rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-darkbg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary dark:text-white"
                />
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-darkbg rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-darkbg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary focus:border-primary dark:focus:border-secondary dark:text-white"
                />
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary dark:bg-secondary hover:bg-primary-dark dark:hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}