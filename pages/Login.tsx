
import React, { useState, useContext, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '../components/ui';

declare global {
  interface Window {
    turnstile: any;
  }
}

export interface TurnstileInstance {
  reset: () => void;
}

const Turnstile = forwardRef<TurnstileInstance, { siteKey: string; onSuccess: (token: string) => void }>(({ siteKey, onSuccess }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.error('Turnstile reset error:', e);
        }
      }
    }
  }));

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current && isMounted) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onSuccessRef.current(token),
          });
        } catch (e) {
          console.error('Turnstile render error:', e);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]); // Only re-run if siteKey changes

  return <div ref={containerRef} />;
});

const Login: React.FC = () => {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setError('Please complete the security verification.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password, turnstileToken);
    } catch (err: any) {
      let message = 'Access Denied. Check your credentials.';
      if (err.message) {
          message = err.message;
      }
      setError(message);
      // Reset Turnstile on failure
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
    setIsLoading(false);
  }, [email, password, login, turnstileToken]);

  const handleForgot = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      try {
          await api.sendPasswordResetEmail(forgotEmail);
          setResetSent(true);
      } catch (err: any) {
          setError(err.message || 'Failed to transmit recovery link.');
      }
      setIsLoading(false);
  };

  return (
    <div className="h-screen flex bg-gray-900 text-sans overflow-hidden">
      {/* Dynamic Branding Pane - Left */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 xl:p-20 bg-black overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(29,185,84,0.08)_0%,_transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12 xl:mb-16">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-primary/20">D</div>
                <span className="text-3xl font-black text-white tracking-tighter uppercase">Digitalsight</span>
            </div>
            <h1 className="text-5xl xl:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85] max-w-2xl">
                Global Network <br/>
                <span className="text-primary">Ingestion Hub.</span>
            </h1>
            <p className="mt-8 xl:mt-10 text-lg xl:text-xl text-gray-500 max-w-md font-medium leading-relaxed">
                The institutional standard for high-fidelity music distribution and metadata compliance.
            </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-8 border-t border-white/5 pt-12 xl:pt-16">
            <div className="space-y-1">
                <p className="text-3xl xl:text-4xl font-bold text-white tracking-tighter">Unlimited</p>
                <p className="text-[10px] xl:text-[11px] text-gray-600 font-black uppercase tracking-[0.2em]">Label Branches</p>
            </div>
            <div className="space-y-1">
                <p className="text-3xl xl:text-4xl font-bold text-white tracking-tighter">Lossless</p>
                <p className="text-[10px] xl:text-[11px] text-gray-600 font-black uppercase tracking-[0.2em]">WAV Encoding</p>
            </div>
            <div className="space-y-1">
                <p className="text-3xl xl:text-4xl font-bold text-white tracking-tighter">Real-Time</p>
                <p className="text-[10px] xl:text-[11px] text-gray-600 font-black uppercase tracking-[0.2em]">Sync Matrix</p>
            </div>
        </div>
      </div>

      {/* Optimized Auth Interface - Right */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8 bg-gray-900 relative overflow-y-auto lg:overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
        
        <div className="w-full max-w-lg relative z-10 animate-slide-up flex flex-col h-full lg:h-auto justify-center">
          {/* Mobile Logo/Brand */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-primary/20">D</div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">Digitalsight</span>
          </div>

          <div className="mb-6 sm:mb-8 text-center px-4">
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white uppercase tracking-tight mb-2">Portal Secure Login</h2>
            <p className="text-gray-500 font-medium text-sm sm:text-base xl:text-lg">Initialize your administrative session to proceed.</p>
          </div>

          <Card className="border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-0 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
            <CardContent className="p-6 sm:p-8 xl:p-12">
              {!isForgotMode ? (
                  <form onSubmit={handleLogin} className="space-y-6 xl:space-y-8">
                    <div className="space-y-4 xl:space-y-6">
                        <div className="relative group">
                            <div className="absolute left-5 top-[2.4rem] sm:top-[2.8rem] xl:top-[3.1rem] text-gray-600 group-focus-within:text-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                            </div>
                            <Input
                              label="Administrative Email"
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="admin@digitalsight.pro"
                              required
                              className="h-12 sm:h-14 xl:h-16 pl-14 bg-black/40 border-gray-800 focus:border-primary text-sm sm:text-base placeholder:text-gray-700 transition-all rounded-xl sm:rounded-2xl"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-5 top-[2.4rem] sm:top-[2.8rem] xl:top-[3.1rem] text-gray-600 group-focus-within:text-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <Input
                              label="Access Credential"
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="h-12 sm:h-14 xl:h-16 pl-14 pr-14 bg-black/40 border-gray-800 focus:border-primary text-sm sm:text-base placeholder:text-gray-700 transition-all rounded-xl sm:rounded-2xl"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-[2.4rem] sm:top-[2.8rem] xl:top-[3.1rem] text-gray-600 hover:text-primary transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                        
                        <div className="flex justify-center scale-90 sm:scale-100">
                            <Turnstile 
                                ref={turnstileRef}
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} 
                                onSuccess={setTurnstileToken}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 xl:p-5 rounded-xl sm:rounded-2xl flex items-start gap-3 xl:gap-4 animate-shake">
                            <svg className="w-5 h-5 xl:w-6 xl:h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-red-500 text-xs xl:text-sm font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button type="submit" className="w-full h-12 sm:h-14 xl:h-16 flex justify-center py-4 text-[10px] xl:text-xs font-black uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(29,185,84,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(29,185,84,0.4)] rounded-xl sm:rounded-2xl transition-all" disabled={isLoading}>
                          {isLoading ? <Spinner className="w-6 h-6" /> : 'Initialize Secure Session'}
                        </Button>
                        
                        <div className="text-center">
                            <button 
                                type="button" 
                                onClick={() => setIsForgotMode(true)} 
                                className="text-[10px] xl:text-[11px] font-black text-gray-600 uppercase tracking-widest hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5"
                            >
                                Credential Recovery Protocol
                            </button>
                        </div>
                    </div>
                  </form>
              ) : (
                  <form onSubmit={handleForgot} className="space-y-6 xl:space-y-8">
                      {resetSent ? (
                          <div className="text-center space-y-6 xl:space-y-8">
                              <div className="bg-primary/10 text-primary p-6 sm:p-8 xl:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-primary/20">
                                  <div className="w-12 h-12 sm:w-14 xl:w-16 sm:h-14 xl:h-16 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                      <svg className="w-6 h-6 sm:w-7 xl:w-8 sm:h-7 xl:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <p className="font-black text-base sm:text-lg xl:text-xl uppercase tracking-tight mb-2">Protocol Dispatched</p>
                                  <p className="text-gray-400 text-xs sm:text-sm xl:text-base font-medium leading-relaxed">A secure credential restoration link has been synchronized to your primary email address.</p>
                              </div>
                              <Button variant="secondary" className="w-full h-12 sm:h-14 xl:h-16 text-[10px] xl:text-[11px] font-black uppercase tracking-[0.2em] rounded-xl sm:rounded-2xl" onClick={() => {setIsForgotMode(false); setResetSent(false);}}>Return to Authentication</Button>
                          </div>
                      ) : (
                          <>
                            <div className="space-y-2 xl:space-y-3">
                                <h3 className="text-lg sm:text-xl xl:text-2xl font-black text-white uppercase tracking-tight">Recover Access</h3>
                                <p className="text-xs sm:text-sm xl:text-base text-gray-500 font-medium leading-relaxed">Enter your registered organizational email. We will transmit restoration instructions via encrypted endpoint.</p>
                            </div>
                            <Input
                                label="Registered Domain Email"
                                type="email"
                                required
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="h-12 sm:h-14 xl:h-16 bg-black/40 border-gray-800 text-sm sm:text-base rounded-xl sm:rounded-2xl"
                            />
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 xl:p-5 rounded-xl sm:rounded-2xl flex items-start gap-3 xl:gap-4 animate-shake">
                                    <svg className="w-5 h-5 xl:w-6 xl:h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-red-500 text-xs xl:text-sm font-bold leading-tight">{error}</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-3 xl:gap-4 pt-2 xl:pt-4">
                                <Button type="submit" disabled={isLoading} className="h-12 sm:h-14 xl:h-16 text-[10px] xl:text-[11px] font-black uppercase tracking-[0.25em] rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20">
                                    {isLoading ? <Spinner className="w-6 h-6" /> : 'Transmit Recovery Link'}
                                </Button>
                                <button 
                                    type="button"
                                    className="h-10 sm:h-12 text-[10px] xl:text-[11px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                                    onClick={() => setIsForgotMode(false)}
                                >
                                    Abort Recovery
                                </button>
                            </div>
                          </>
                      )}
                  </form>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6 sm:mt-8 xl:mt-12 text-center">
              <p className="text-[8px] sm:text-[10px] xl:text-[11px] text-gray-700 font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] flex items-center justify-center gap-2 sm:gap-3">
                  <span className="h-px w-4 sm:w-8 bg-gray-800"></span>
                  Digitalsight Security Architecture v3.4
                  <span className="h-px w-4 sm:w-8 bg-gray-800"></span>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
