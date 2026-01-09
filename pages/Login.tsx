import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '../components/ui';

const Login: React.FC = () => {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email);
    } catch (err) {
      setError((err as Error).message);
    }
    setIsLoading(false);
  };

  const handleForgot = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
          setResetSent(true);
          setIsLoading(false);
      }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
              {isForgotMode ? 'Reset Password' : 'Welcome to MusicDistro Pro'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isForgotMode ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full flex justify-center" disabled={isLoading}>
                  {isLoading ? <Spinner /> : 'Log In'}
                </Button>
                <div className="text-center">
                    <button type="button" onClick={() => setIsForgotMode(true)} className="text-xs text-primary hover:underline">Forgot password?</button>
                </div>
                <div className="text-center text-[10px] text-gray-500 border-t border-gray-800 pt-4 uppercase tracking-widest font-bold">
                    Demo Credentials
                    <ul className="mt-2 text-gray-400 space-y-1 normal-case tracking-normal font-normal">
                        <li><code className="bg-gray-700 px-1 rounded text-white">owner@distro.pro</code></li>
                        <li><code className="bg-gray-700 px-1 rounded text-white">admin@futuresound.com</code></li>
                        <li><code className="bg-gray-700 px-1 rounded text-white">admin@retrowave.com</code></li>
                    </ul>
                </div>
              </form>
          ) : (
              <form onSubmit={handleForgot} className="space-y-6">
                  {resetSent ? (
                      <div className="text-center space-y-4">
                          <div className="bg-green-900/20 text-green-400 p-4 rounded-md border border-green-800">
                              A password reset link has been sent to your email.
                          </div>
                          <Button variant="secondary" onClick={() => {setIsForgotMode(false); setResetSent(false);}}>Back to Login</Button>
                      </div>
                  ) : (
                      <>
                        <p className="text-sm text-gray-400">Enter your email and we'll send you a demo recovery link.</p>
                        <Input label="Email Address" type="email" required placeholder="your@email.com" />
                        <div className="flex flex-col gap-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Spinner /> : 'Send Reset Link'}
                            </Button>
                            <Button variant="secondary" onClick={() => setIsForgotMode(false)}>Cancel</Button>
                        </div>
                      </>
                  )}
              </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;