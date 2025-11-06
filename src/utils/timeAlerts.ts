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
  deliveredAt?: string | null
): TimeAlert | null {
  if (!scheduledTime) {
    return null;
  }

  // Special handling for delivered orders
  if (orderStatus === 'Entregado' && deliveredAt) {
    return getDeliveredOrderAlert(scheduledTime, deliveredAt);
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
 * Get alert information for delivered orders with scheduled time
 * Shows neutral informative badge without colors or animations
 */
export function getDeliveredOrderAlert(
  scheduledTime: string,
  deliveredAt: string
): TimeAlert {
  const scheduled = new Date(scheduledTime);
  const delivered = new Date(deliveredAt);
  const diffMs = delivered.getTime() - scheduled.getTime();
  const minutesDiff = Math.floor(diffMs / 1000 / 60);

  // Delivered on time or early
  if (minutesDiff <= 0) {
    return {
      level: 'delivered',
      minutesRemaining: minutesDiff,
      className: '',
      badgeText: 'Entregado a tiempo',
      badgeColor: 'bg-gray-500 dark:bg-gray-600',
      iconAnimation: ''
    };
  }

  // Delivered late
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

  return {
    level: 'delivered',
    minutesRemaining: minutesDiff,
    className: '',
    badgeText: `Entregado con ${delayText} de retraso`,
    badgeColor: 'bg-gray-500 dark:bg-gray-600',
    iconAnimation: ''
  };
}
