import React from 'react';
import { motion } from 'motion/react';
import { Languages } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 pb-0 text-center">
          <div className="inline-flex p-3 bg-indigo-50 rounded-2xl mb-6">
            <Languages className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        
        <div className="p-8">
          {children}
        </div>
        
        <div className="p-8 pt-0 text-center">
          <p className="text-xs text-slate-400">
            Powered by MiniTranslator AI &bull; Secure Access
          </p>
        </div>
      </motion.div>
    </div>
  );
};
