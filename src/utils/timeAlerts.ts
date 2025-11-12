export type AlertLevel = 'none' | 'info' | 'warning' | 'urgent' | 'critical' | 'delivered';
export type OrderStatus = 'Recibido' | 'EnPreparacion' | 'Listo' | 'Entregado';

export interface TimeAlert {
  level: AlertLevel;
  minutesRemaining: number;
  className: string;
  badgeText: string;
  badgeColor: string;
  iconAnimation: string;
}

export function getScheduledOrderAlert(
  scheduledTime: string | null,
  orderStatus?: OrderStatus,
  readyAt?: string | null,
  deliveredAt?: string | null
): TimeAlert | null {
  if (!scheduledTime) {
    return null;
  }

  // Special handling for orders that are ready or delivered
  // We calculate delay based on when it reached "Listo" (ready_at), not when delivered
  if ((orderStatus === 'Listo' || orderStatus === 'Entregado') && readyAt) {
    return getReadyOrderAlert(scheduledTime, readyAt, orderStatus);
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
    let delayText: string;

    if (minutesLate >= 60) {
      const hours = Math.floor(minutesLate / 60);
      const remainingMinutes = minutesLate % 60;
      if (remainingMinutes === 0) {
        delayText = `${hours}h`;
      } else {
        delayText = `${hours}h ${remainingMinutes}min`;
      }
    } else {
      delayText = `${minutesLate} min`;
    }

    return {
      level: 'critical',
      minutesRemaining,
      className: 'alert-red',
      badgeText: `¡RETRASADO ${delayText}!`,
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

/**
 * Get alert information for orders that reached "Listo" status with scheduled time
 * Calculates delay based on ready_at (when it was marked as ready), not delivered_at
 * This properly measures business performance, not customer pickup delays
 * Shows neutral informative badge without active alert colors or animations
 */
export function getReadyOrderAlert(
  scheduledTime: string,
  readyAt: string,
  orderStatus: OrderStatus
): TimeAlert {
  const scheduled = new Date(scheduledTime);
  const ready = new Date(readyAt);
  const diffMs = ready.getTime() - scheduled.getTime();
  const minutesDiff = Math.floor(diffMs / 1000 / 60);

  // Ready on time or early
  if (minutesDiff <= 0) {
    const statusText = orderStatus === 'Entregado' ? 'Entregado' : 'Listo';
    return {
      level: 'delivered',
      minutesRemaining: minutesDiff,
      className: '',
      badgeText: `${statusText} a tiempo`,
      badgeColor: 'bg-gray-500 dark:bg-gray-600',
      iconAnimation: ''
    };
  }

  // Ready late - format delay text
  let delayText: string;
  if (minutesDiff >= 60) {
    const hours = Math.floor(minutesDiff / 60);
    const remainingMinutes = minutesDiff % 60;
    if (remainingMinutes === 0) {
      delayText = `${hours}h`;
    } else {
      delayText = `${hours}h ${remainingMinutes}min`;
    }
  } else {
    delayText = `${minutesDiff} min`;
  }

  const statusText = orderStatus === 'Entregado' ? 'Entregado' : 'Listo';
  return {
    level: 'delivered',
    minutesRemaining: minutesDiff,
    className: '',
    badgeText: `${statusText} con ${delayText} de retraso`,
    badgeColor: 'bg-gray-500 dark:bg-gray-600',
    iconAnimation: ''
  };
}
