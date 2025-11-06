export type AlertLevel = 'none' | 'info' | 'warning' | 'urgent' | 'critical';

export interface TimeAlert {
  level: AlertLevel;
  minutesRemaining: number;
  className: string;
  badgeText: string;
  badgeColor: string;
  iconAnimation: string;
}

export function getScheduledOrderAlert(scheduledTime: string | null): TimeAlert | null {
  if (!scheduledTime) {
    return null;
  }

  const now = new Date();
  const scheduled = new Date(scheduledTime);
  const diffMs = scheduled.getTime() - now.getTime();
  const minutesRemaining = Math.floor(diffMs / 1000 / 60);

  // If more than 30 minutes away, no alert
  if (minutesRemaining > 30) {
    return null;
  }

  // OVERDUE: Time has passed
  if (diffMs < 0) {
    const minutesLate = Math.abs(minutesRemaining);
    return {
      level: 'critical',
      minutesRemaining,
      className: 'alert-red',
      badgeText: `¡RETRASADO ${minutesLate} min!`,
      badgeColor: 'bg-red-600',
      iconAnimation: 'spin-urgent'
    };
  }

  // Critical: Less than 5 minutes
  if (minutesRemaining < 5) {
    return {
      level: 'critical',
      minutesRemaining,
      className: 'alert-red',
      badgeText: '¡URGENTE!',
      badgeColor: 'bg-red-500',
      iconAnimation: 'spin-urgent'
    };
  }

  // Urgent: 5-10 minutes
  if (minutesRemaining < 10) {
    return {
      level: 'urgent',
      minutesRemaining,
      className: 'alert-orange',
      badgeText: '¡Preparar YA!',
      badgeColor: 'bg-orange-500',
      iconAnimation: 'spin-fast'
    };
  }

  // Warning: 10-20 minutes
  if (minutesRemaining < 20) {
    return {
      level: 'warning',
      minutesRemaining,
      className: 'alert-yellow',
      badgeText: `Preparar en ${minutesRemaining} min`,
      badgeColor: 'bg-yellow-500',
      iconAnimation: 'spin-slow'
    };
  }

  // Info: 20-30 minutes
  return {
    level: 'info',
    minutesRemaining,
    className: '',
    badgeText: 'Preparar pronto',
    badgeColor: 'bg-blue-500',
    iconAnimation: ''
  };
}
