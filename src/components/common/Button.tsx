import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-[#6C63FF] hover:bg-[#5a52d6] text-white',
    secondary: 'bg-[#FF6584] hover:bg-[#e55a76] text-white',
    outline: 'border-2 border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white',
  };
  
  return (
    <button
      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
