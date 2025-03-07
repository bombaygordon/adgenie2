import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b23] flex">
      {/* Left Section - Sign Up Form */}
      <div className="w-1/2 p-8 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-16">
            <div className="h-8 w-8 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded"></div>
            <span className="text-white text-xl font-semibold">AdGenie</span>
          </div>

          {/* Sign Up Form */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-2">Sign up</h1>
            <p className="text-gray-400 mb-8">Start your 30-day free trial.</p>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name*
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 bg-[#2a2b32] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 bg-[#2a2b32] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password*
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-3 bg-[#2a2b32] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-sm text-gray-500 mt-2">Must be at least 8 characters.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity gradient-animate disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Get started'}
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-400 bg-[#1a1b23]">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-[#2a2b32] border border-gray-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-[#3a3b42] transition-colors"
                >
                  <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
                  Sign up with Google
                </button>

                <button
                  type="button"
                  className="w-full py-3 px-4 bg-[#2a2b32] border border-gray-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-[#3a3b42] transition-colors"
                >
                  <Image src="/facebook-icon.svg" alt="Facebook" width={20} height={20} />
                  Sign up with Facebook
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-500 hover:text-blue-400">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          <span>© AdGenie 2024</span>
          <a href="mailto:help@adgenie.com" className="ml-4 hover:text-gray-400">
            help@adgenie.com
          </a>
        </div>
      </div>

      {/* Right Section - Preview */}
      <div className="w-1/2 bg-[#2a2b32] p-8 flex items-center justify-center">
        <div className="relative w-full h-full max-w-2xl">
          {/* Add your dashboard preview components here */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Introducing AdGenie Dashboard</h2>
            <p className="text-gray-400">
              Powerful self-serve ad analytics to help you grow your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 