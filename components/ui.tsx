
import React, { ReactNode } from 'react';
import { ReleaseStatus } from '../types';
import { STATUS_COLORS } from '../constants';

// --- Badge ---
interface BadgeProps {
  status: ReleaseStatus;
}
export const Badge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${STATUS_COLORS[status]}`}>
    {status}
  </span>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', className = '', ...props }, ref) => {
    const baseClasses = "px-6 py-3 rounded-xl font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98]";
    const variantClasses = {
      primary: 'bg-primary hover:bg-primary-dark text-black focus:ring-primary',
      secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/5 focus:ring-gray-600',
      danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
    };
    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

// --- Card ---
interface CardProps {
  children: ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-gray-800 rounded-2xl shadow-2xl p-6 ${className}`}>
    {children}
  </div>
);
export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`border-b border-white/5 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);
export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
    <h2 className={`text-xl font-black text-white tracking-tight ${className}`}>{children}</h2>
);
export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);


// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, className = '', ...props }, ref) => (
    <div className="space-y-2">
        {label && <label htmlFor={id} className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">{label}</label>}
        <input
            ref={ref}
            id={id}
            className={`w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${className}`}
            {...props}
        />
    </div>
));

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, id, ...props }, ref) => (
    <div className="space-y-2">
        {label && <label htmlFor={id} className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">{label}</label>}
        <textarea
            ref={ref}
            id={id}
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all min-h-[100px]"
            {...props}
        />
    </div>
));


// --- Modal ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl'
    }
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in">
            <div className={`bg-gray-900 border border-white/5 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full ${sizeClasses[size]} flex flex-col max-h-[95vh]`}>
                <div className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">&times;</button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Spinner ---
export const Spinner: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${className}`}></div>
);

// --- PageLoader ---
export const PageLoader: React.FC = () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <Spinner className="h-16 w-16 border-primary relative z-10" />
        </div>
        <p className="mt-8 text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Cloud Data</p>
    </div>
);

// --- Pagination ---
interface PaginationProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}
export const Pagination: React.FC<PaginationProps> = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/5 bg-black/20 mt-2 rounded-b-2xl">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Showing <span className="text-white">{start}-{end}</span> of <span className="text-white">{totalItems}</span> Entries
            </div>
            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-primary hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first, last, and pages around current
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${
                                    currentPage === pageNum 
                                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                                    : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="text-gray-600 px-1 font-black">...</span>;
                    }
                    return null;
                })}

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-primary hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
};
