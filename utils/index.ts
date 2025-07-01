export function getCurrentDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

export function generateTimeSlots(): string[] {
  const slots = [];
  const startHour = 19; // 7 PM
  const endHour = 2; // 2 AM
  
  for (let hour = startHour; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push(`${hour}:${minute === 0 ? '00' : minute}`);
    }
  }
  
  // Add early morning hours
  for (let hour = 0; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push(`${hour}:${minute === 0 ? '00' : minute}`);
    }
  }
  
  return slots;
}

export function formatTimeSlot(timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(':');
  const hour = parseInt(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function formatOpenHours(hours?: { open: string; close: string; closed?: boolean }): string {
  if (!hours || hours.closed) return 'Closed today';
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}${minutes !== '00' ? ':' + minutes : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  
  return `${formatTime(hours.open)} - ${formatTime(hours.close)}`;
}

export function formatPrice(priceLevel: number): string {
  const symbols = [];
  for (let i = 0; i < priceLevel; i++) {
    symbols.push('$');
  }
  return symbols.join('');
}