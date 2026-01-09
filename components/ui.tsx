import React, { ReactNode } from 'react';
import { ReleaseStatus } from '../types';
import { STATUS_COLORS } from '../constants';

// --- Badge ---
interface BadgeProps {
  status: ReleaseStatus;
}
export const Badge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-bold rounded-full ${STATUS_COLORS[status]}`}>
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
    const baseClasses = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";
    const variantClasses = {
      primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary',
      secondary: 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500',
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
  <div className={`bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
    {children}
  </div>
);
export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`border-b border-gray-700 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);
export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
    <h2 className={`text-xl font-bold text-white ${className}`}>{children}</h2>
);
export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);


// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, ...props }, ref) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <input
            ref={ref}
            id={id}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            {...props}
        />
    </div>
));

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, id, ...props }, ref) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <textarea
            ref={ref}
            id={id}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto">
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
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <Spinner className="h-12 w-12 border-primary relative z-10" />
        </div>
        <p className="mt-6 text-gray-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Data</p>
    </div>
);