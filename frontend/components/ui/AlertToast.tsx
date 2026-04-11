'use client';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import type { AlertSeverity } from '@/types';
import { cn } from '@/lib/utils';

interface AlertToastProps {
  severity: AlertSeverity;
  title: string;
  description: string;
  onClose: () => void;
  onClick?: () => void;
}

/**
 * Modern alert toast notification component
 * Displays severity-based styling with icon, title, and description
 * 
 * Features:
 * - Severity-based colors (critical=red, warning=amber, info=blue)
 * - Light/dark mode support
 * - Auto-dismiss after 5 seconds
 * - Click to dismiss or navigate
 * - Animated entrance/exit
 */
export function AlertToast({
  severity,
  title,
  description,
  onClose,
  onClick,
}: AlertToastProps) {
  // Get severity-specific styling
  const styles = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-900/50',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-200',
      desc: 'text-red-700 dark:text-red-300',
      badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      IconComponent: AlertCircle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-900/50',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-200',
      desc: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
      IconComponent: AlertCircle,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-900/50',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-200',
      desc: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
      IconComponent: Info,
    },
  };

  const style = styles[severity];
  const { IconComponent } = style;

  // Severity badge text
  const severityLabel = {
    critical: '🔴 CRITICAL',
    warning: '🟡 WARNING',
    info: '🔵 INFO',
  }[severity];

  return (
    <div
      className={cn(
        'animate-fade-in w-full max-w-md rounded-lg border backdrop-blur-sm shadow-lg',
        'transition-all duration-300 ease-out',
        style.bg,
        style.border,
        onClick ? 'cursor-pointer hover:shadow-xl' : ''
      )}
      onClick={onClick}
      role="alert"
      aria-live="polite"
    >
      {/* Top bar with severity badge */}
      <div className={cn('px-4 py-2 border-b', style.border)}>
        <span className={cn('text-xs font-bold tracking-wider', style.badge, 'px-2 py-1 rounded inline-block')}>
          {severityLabel}
        </span>
      </div>

      {/* Main content */}
      <div className="p-4 flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          <IconComponent className={cn('w-5 h-5', style.icon)} />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-sm leading-tight mb-1', style.title)}>
            {title}
          </h3>
          <p className={cn('text-sm leading-relaxed', style.desc)}>
            {description}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
            style.icon
          )}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss countdown */}
      <div className="h-0.5 bg-black/5 dark:bg-white/5 overflow-hidden">
        <div
          className={cn(
            'h-full animate-pulse',
            {
              'bg-red-400 dark:bg-red-500': severity === 'critical',
              'bg-amber-400 dark:bg-amber-500': severity === 'warning',
              'bg-blue-400 dark:bg-blue-500': severity === 'info',
            }
          )}
          style={{
            animation: 'progress-bar 5s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes progress-bar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-12px) translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
