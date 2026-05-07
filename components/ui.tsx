"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Circle,
  Download,
  Gamepad2,
  Laptop,
  LayoutList,
  LogOut,
  Moon,
  Search,
  Settings,
  Train,
  User,
  Utensils,
  Dumbbell
} from "lucide-react";

export const icons = {
  BarChart3,
  Bell,
  CalendarDays,
  Circle,
  Download,
  Gamepad2,
  Laptop,
  LayoutList,
  LogOut,
  Moon,
  Search,
  Settings,
  Train,
  User,
  Utensils,
  Dumbbell
};

export type IconName = keyof typeof icons;

export function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name as IconName] ?? Circle;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function Button({
  children,
  appearance = "secondary",
  icon,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  appearance?: "primary" | "secondary" | "subtle" | "danger";
  icon?: IconName;
}) {
  const Icon = icon ? icons[icon] : null;
  return (
    <button className={`button button-${appearance} ${className}`} {...props}>
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "neutral" | "success" | "warning" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="text-input" {...props} />;
}
