import React, { useContext } from "react";
import { ThemeContext } from "../../config/theme";

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  style = {},
  variant = "primary",
  size = "md",
  ...props
}) {
  const { theme } = useContext(ThemeContext);

  const main = theme?.main || theme?.primary || "#DD6B20";
  const dark = theme?.dark || main;
  const softBg = theme?.softBg || "rgba(221,107,32,0.10)";

  const variantStyles = {
    primary: {
      backgroundImage: `linear-gradient(135deg, ${main}, ${dark})`,
      color: "#FFFFFF",
      border: "1px solid transparent",
    },
    secondary: {
      backgroundColor: softBg,
      color: dark,
      border: `1px solid ${softBg}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: dark,
      border: "1px solid transparent",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold",
        "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 active:scale-[0.99]",
        className,
      ].join(" ")}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
