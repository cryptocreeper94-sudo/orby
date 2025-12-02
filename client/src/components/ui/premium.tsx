import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AnimatedBackground({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 -z-20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent -z-10" />
      <Stars />
      <OrbyWatermark />
      {children}
    </div>
  );
}

function Stars() {
  const stars = React.useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    })), []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-cyan-400/60"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function OrbyWatermark() {
  return (
    <div className="fixed bottom-4 right-4 opacity-10 pointer-events-none -z-5 select-none">
      <div className="relative">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 blur-sm" />
        <div className="absolute inset-2 md:inset-3 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 flex items-center justify-center">
          <span className="text-3xl md:text-5xl font-black text-slate-900/50">O</span>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 rounded-full bg-white/30 blur-[1px]" />
      </div>
    </div>
  );
}

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { glow?: boolean; gradient?: boolean }
>(({ className, glow, gradient, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={cn(
      "relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden",
      glow && "shadow-cyan-500/20 shadow-lg",
      gradient && "bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80",
      className
    )}
  >
    {children}
  </motion.div>
));
GlassCard.displayName = "GlassCard";

export const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 md:p-6 border-b border-white/5", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

export const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 md:p-6", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

export function StatCard({ 
  icon, 
  label, 
  value, 
  subValue,
  trend,
  color = "cyan",
  size = "default"
}: { 
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  color?: "cyan" | "green" | "amber" | "red" | "purple" | "blue";
  size?: "compact" | "default" | "large";
}) {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    green: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
  };

  const sizeClasses = {
    compact: "p-3",
    default: "p-4 md:p-5",
    large: "p-5 md:p-6",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-xl border bg-gradient-to-br backdrop-blur-sm overflow-hidden group cursor-default",
        colorClasses[color],
        sizeClasses[size]
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-slate-400 font-medium">{label}</p>
          <p className={cn(
            "font-bold tracking-tight",
            size === "compact" ? "text-xl" : size === "large" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
          )}>{value}</p>
          {subValue && (
            <p className="text-xs text-slate-500">{subValue}</p>
          )}
        </div>
        <div className={cn(
          "rounded-lg bg-white/5 p-2 md:p-2.5",
          colorClasses[color].split(' ').find(c => c.startsWith('text-'))
        )}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={cn(
          "absolute bottom-2 right-2 text-xs font-medium",
          trend === "up" && "text-emerald-400",
          trend === "down" && "text-red-400",
          trend === "neutral" && "text-slate-500"
        )}>
          {trend === "up" && "↑"}
          {trend === "down" && "↓"}
          {trend === "neutral" && "→"}
        </div>
      )}
    </motion.div>
  );
}

export function GlowButton({ 
  children, 
  className,
  variant = "cyan",
  size = "default",
  onClick,
  disabled,
  type = "button",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "cyan" | "green" | "amber" | "red" | "purple";
  size?: "sm" | "default" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  "data-testid"?: string;
}) {
  const variantClasses = {
    cyan: "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/40 hover:shadow-cyan-400/60",
    green: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/40 hover:shadow-emerald-400/60",
    amber: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/40 hover:shadow-amber-400/60",
    red: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-500/40 hover:shadow-red-400/60",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 shadow-purple-500/40 hover:shadow-purple-400/60",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 md:px-5 md:py-2.5",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(
        "relative rounded-xl font-semibold text-white shadow-lg transition-all duration-200",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

export function StatusBadge({ 
  status, 
  pulse = false,
  size = "default" 
}: { 
  status: string;
  pulse?: boolean;
  size?: "sm" | "default";
}) {
  const statusConfig: Record<string, { bg: string; text: string; glow?: string }> = {
    active: { bg: "bg-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/30" },
    open: { bg: "bg-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/30" },
    online: { bg: "bg-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/30" },
    pending: { bg: "bg-amber-500/20", text: "text-amber-400", glow: "shadow-amber-500/30" },
    "in progress": { bg: "bg-blue-500/20", text: "text-blue-400", glow: "shadow-blue-500/30" },
    reported: { bg: "bg-amber-500/20", text: "text-amber-400", glow: "shadow-amber-500/30" },
    "under review": { bg: "bg-blue-500/20", text: "text-blue-400", glow: "shadow-blue-500/30" },
    resolved: { bg: "bg-slate-500/20", text: "text-slate-400" },
    closed: { bg: "bg-slate-500/20", text: "text-slate-400" },
    critical: { bg: "bg-red-500/20", text: "text-red-400", glow: "shadow-red-500/30" },
    emergency: { bg: "bg-red-500/20", text: "text-red-400", glow: "shadow-red-500/30" },
    rush: { bg: "bg-orange-500/20", text: "text-orange-400", glow: "shadow-orange-500/30" },
    delivered: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    confirmed: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  };

  const config = statusConfig[status.toLowerCase()] || { bg: "bg-slate-500/20", text: "text-slate-400" };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        pulse && config.glow && `shadow-lg ${config.glow}`,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs md:text-sm"
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.bg.replace('/20', '/60'))} />
          <span className={cn("relative inline-flex rounded-full h-2 w-2", config.bg.replace('/20', ''))} />
        </span>
      )}
      {status}
    </motion.span>
  );
}

export function BentoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}

export function BentoCard({ 
  children, 
  className,
  span = 1,
  spanMd,
  spanLg
}: { 
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
  spanMd?: 1 | 2 | 3 | 4;
  spanLg?: 1 | 2 | 3 | 4;
}) {
  const spanClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4",
  };

  return (
    <GlassCard 
      gradient 
      className={cn(
        spanClasses[span],
        spanMd && `md:col-span-${spanMd}`,
        spanLg && `lg:col-span-${spanLg}`,
        className
      )}
    >
      {children}
    </GlassCard>
  );
}

export function AnimatedList({ 
  children, 
  className,
  stagger = 0.05
}: { 
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div 
      className={cn("space-y-3", className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function ListItem({ 
  children, 
  className,
  onClick,
  active
}: { 
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ x: 4, backgroundColor: "rgba(6, 182, 212, 0.05)" }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border border-white/5 bg-slate-800/40 transition-colors cursor-pointer group",
        active && "border-cyan-500/30 bg-cyan-500/10",
        className
      )}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </motion.div>
  );
}

export function SectionHeader({ 
  title, 
  subtitle, 
  action,
  icon 
}: { 
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="p-4 rounded-2xl bg-slate-800/50 mb-4 text-slate-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </motion.div>
  );
}

export function ProgressRing({ 
  value, 
  max = 100, 
  size = 60,
  strokeWidth = 6,
  color = "cyan"
}: { 
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: "cyan" | "green" | "amber" | "red";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min((value / max) * 100, 100);
  const offset = circumference - (percent / 100) * circumference;

  const colorClasses = {
    cyan: "stroke-cyan-400",
    green: "stroke-emerald-400",
    amber: "stroke-amber-400",
    red: "stroke-red-400",
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colorClasses[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{Math.round(percent)}%</span>
      </div>
    </div>
  );
}

const ICON_COLORS = {
  cyan: "from-cyan-500/20 to-cyan-600/10 text-cyan-400",
  amber: "from-amber-500/20 to-amber-600/10 text-amber-400",
  green: "from-emerald-500/20 to-emerald-600/10 text-emerald-400",
  red: "from-red-500/20 to-red-600/10 text-red-400",
  purple: "from-violet-500/20 to-violet-600/10 text-violet-400",
  blue: "from-blue-500/20 to-blue-600/10 text-blue-400",
};

export function PageHeader({ 
  title, 
  subtitle,
  subtitleColor,
  icon,
  iconColor = "cyan",
  actions,
  backAction
}: { 
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  icon?: React.ReactNode;
  iconColor?: keyof typeof ICON_COLORS;
  actions?: React.ReactNode;
  backAction?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {backAction && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={backAction}
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
          {icon && (
            <div className={cn("p-2 rounded-xl bg-gradient-to-br", ICON_COLORS[iconColor])}>
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className={cn("text-xs md:text-sm", subtitleColor || "text-slate-400")}>{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export function DesktopSidebar({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn(
      "hidden lg:flex lg:flex-col lg:w-72 xl:w-80 border-r border-white/10 bg-slate-950/50 backdrop-blur-sm",
      className
    )}>
      {children}
    </aside>
  );
}

export function ResponsiveLayout({ 
  sidebar, 
  main,
  className 
}: { 
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      {sidebar && <DesktopSidebar>{sidebar}</DesktopSidebar>}
      <main className="flex-1 overflow-auto">
        {main}
      </main>
    </div>
  );
}
