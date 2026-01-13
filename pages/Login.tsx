
import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Spinner } from '../components/ui';

const Login: React.FC = () => {
  const { login, pendingFounder, completeFounderSetup } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const [founderName, setFounderName] = useState('');
  const [founderDesignation, setFounderDesignation] = useState('Founder / CEO');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      let message = 'Access Denied. Check your credentials.';
      // Normalize Firebase v10 combined error codes
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          message = 'The email or password provided is incorrect.';
      } else if (err.message) {
          message = err.message;
      }
      setError(message);
    }
    setIsLoading(false);
  };

  const handleFounderSetup = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await completeFounderSetup(founderName, founderDesignation);
      } catch (err: any) {
          setError(err.message || 'Setup failed.');
      }
      setIsLoading(false);
  };

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

  if (pendingFounder) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
          <Card className="w-full max-w-lg border-primary/20 bg-gray-800/50 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-[2rem]">
            <CardHeader className="text-center pt-12 border-none">
              <div className="w-20 h-20 bg-primary text-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(29,185,84,0.3)]">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
              </div>
              <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">Root Profile Genesis</CardTitle>
              <div className="mt-4 inline-block bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{pendingFounder.email}</p>
              </div>
            </CardHeader>
            <CardContent className="pb-16 px-12">
                <form onSubmit={handleFounderSetup} className="space-y-8">
                    <p className="text-sm text-gray-400 text-center leading-relaxed">
                        Security verification successful. Please establish your master administrative identity to access the Digitalsight Core.
                    </p>
                    <div className="space-y-6">
                        <Input 
                            label="Full Legal Identity" 
                            required 
                            value={founderName} 
                            onChange={e => setFounderName(e.target.value)} 
                            placeholder="e.g. Alexander Pierce"
                            className="h-14 bg-black/40 border-gray-700 text-base"
                        />
                        <Input 
                            label="Executive Designation" 
                            required 
                            value={founderDesignation} 
                            onChange={e => setFounderDesignation(e.target.value)} 
                            placeholder="Founder / CEO"
                            className="h-14 bg-black/40 border-gray-700 text-base"
                        />
                    </div>
                    <Button type="submit" className="w-full h-16 text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 rounded-2xl" disabled={isLoading}>
                      {isLoading ? <Spinner className="w-6 h-6" /> : 'Activate Platform Authority'}
                    </Button>
                </form>
            </CardContent>
          </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-sans overflow-hidden">
      {/* Dynamic Branding Pane - Left */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-20 bg-black overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(29,185,84,0.08)_0%,_transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-16">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-primary/20">D</div>
                <span className="text-3xl font-black text-white tracking-tighter uppercase">Digitalsight</span>
            </div>
            <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-[0.85] max-w-2xl">
                Global Network <br/>
                <span className="text-primary">Ingestion Hub.</span>
            </h1>
            <p className="mt-10 text-xl text-gray-500 max-w-md font-medium leading-relaxed">
                The institutional standard for high-fidelity music distribution and metadata compliance.
            </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-8 border-t border-white/5 pt-16">
            <div className="space-y-1">
                <p className="text-4xl font-bold text-white tracking-tighter">Unlimited</p>
                <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.2em]">Label Branches</p>
            </div>
            <div className="space-y-1">
                <p className="text-4xl font-bold text-white tracking-tighter">Lossless</p>
                <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.2em]">WAV Encoding</p>
            </div>
            <div className="space-y-1">
                <p className="text-4xl font-bold text-white tracking-tighter">Real-Time</p>
                <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.2em]">Sync Matrix</p>
            </div>
        </div>
      </div>

      {/* Optimized Auth Interface - Right */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-gray-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
        
        <div className="w-full max-w-lg relative z-10 animate-slide-up">
          <div className="mb-12 text-center lg:text-left px-4">
            <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-3">Portal Secure Login</h2>
            <p className="text-gray-500 font-medium text-lg">Initialize your administrative session to proceed.</p>
          </div>

          <Card className="border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-0 overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-12">
              {!isForgotMode ? (
                  <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-6">
                        <div className="relative group">
                            <div className="absolute left-5 top-[3.1rem] text-gray-600 group-focus-within:text-primary transition-colors">
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
                              className="h-16 pl-14 bg-black/40 border-gray-800 focus:border-primary text-base placeholder:text-gray-700 transition-all rounded-2xl"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-5 top-[3.1rem] text-gray-600 group-focus-within:text-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <Input
                              label="Access Credential"
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="h-16 pl-14 bg-black/40 border-gray-800 focus:border-primary text-base placeholder:text-gray-700 transition-all rounded-2xl"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-start gap-4 animate-shake">
                            <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-red-500 text-sm font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full h-16 flex justify-center py-4 text-xs font-black uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(29,185,84,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(29,185,84,0.4)] rounded-2xl transition-all" disabled={isLoading}>
                      {isLoading ? <Spinner className="w-6 h-6" /> : 'Initialize Secure Session'}
                    </Button>
                    
                    <div className="pt-2 text-center">
                        <button 
                            type="button" 
                            onClick={() => setIsForgotMode(true)} 
                            className="text-[11px] font-black text-gray-600 uppercase tracking-widest hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5"
                        >
                            Credential Recovery Protocol
                        </button>
                    </div>
                  </form>
              ) : (
                  <form onSubmit={handleForgot} className="space-y-8">
                      {resetSent ? (
                          <div className="text-center space-y-8">
                              <div className="bg-primary/10 text-primary p-10 rounded-[2rem] border border-primary/20">
                                  <div className="w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-6">
                                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <p className="font-black text-xl uppercase tracking-tight mb-2">Protocol Dispatched</p>
                                  <p className="text-gray-400 font-medium leading-relaxed">A secure credential restoration link has been synchronized to your primary email address.</p>
                              </div>
                              <Button variant="secondary" className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl" onClick={() => {setIsForgotMode(false); setResetSent(false);}}>Return to Authentication</Button>
                          </div>
                      ) : (
                          <>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Recover Access</h3>
                                <p className="text-base text-gray-500 font-medium leading-relaxed">Enter your registered organizational email. We will transmit restoration instructions via encrypted endpoint.</p>
                            </div>
                            <Input
                                label="Registered Domain Email"
                                type="email"
                                required
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="h-16 bg-black/40 border-gray-800 text-base rounded-2xl"
                            />
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-start gap-4 animate-shake">
                                    <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-red-500 text-sm font-bold leading-tight">{error}</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-4 pt-4">
                                <Button type="submit" disabled={isLoading} className="h-16 text-[11px] font-black uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-primary/20">
                                    {isLoading ? <Spinner className="w-6 h-6" /> : 'Transmit Recovery Link'}
                                </Button>
                                <Button variant="secondary" className="h-14 text-[11px] font-black uppercase tracking-widest rounded-2xl" onClick={() => setIsForgotMode(false)}>Abort Recovery</Button>
                            </div>
                          </>
                      )}
                  </form>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-16 text-center">
              <p className="text-[11px] text-gray-700 font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-gray-800"></span>
                  Digitalsight Security Architecture v3.4
                  <span className="h-px w-8 bg-gray-800"></span>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;