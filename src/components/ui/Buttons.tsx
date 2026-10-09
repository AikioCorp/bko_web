import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-semibold rounded-md",
    md: "px-4 py-2 text-sm font-semibold rounded-lg",
    lg: "px-6 py-3 text-base font-bold rounded-xl",
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 bg-[#E6B009] text-[#0B0F17] hover:bg-[#F2C029] active:bg-[#CD9C07] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses[size]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-medium rounded-md",
    md: "px-4 py-2 text-sm font-medium rounded-lg",
    lg: "px-6 py-3 text-base font-semibold rounded-xl",
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 bg-[#161B22] text-[#F0F6FC] border border-[#30363D] hover:bg-[#262C36] hover:border-[#8B949E] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses[size]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const GhostButton: React.FC<ButtonProps> = ({
  children,
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs font-medium rounded",
    md: "px-3 py-1.5 text-sm font-medium rounded-md",
    lg: "px-4 py-2 text-base font-medium rounded-lg",
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#161B22] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses[size]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const IconButton: React.FC<ButtonProps> = ({ children, size = "md", className = "", ...props }) => {
  const sizeClasses = {
    sm: "p-1.5 text-xs rounded-md",
    md: "p-2 text-sm rounded-lg",
    lg: "p-3 text-base rounded-xl",
  };

  return (
    <button
      className={`inline-flex items-center justify-center text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#1F242D] border border-transparent hover:border-[#30363D] transition-all duration-150 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

