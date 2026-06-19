/**
 * Returns true if `habit` is scheduled to run on `date`.
 *
 * Frequency rules:
 *   daily    – every day
 *   weekdays – Mon–Fri (dow 1–5)
 *   weekend  – Sat–Sun (dow 0, 6)
 *   weekly   – every Sunday (dow 0)
 *   monthly  – on the same day-of-month as startDate
 */
export const isHabitScheduledOn = (habit, date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Before the habit's start date → not scheduled
  if (habit.startDate) {
    const [y, m, day] = habit.startDate.split('-').map(Number);
    const start = new Date(y, m - 1, day);
    start.setHours(0, 0, 0, 0);
    if (d < start) return false;
  }

  const dow  = d.getDay(); // 0=Sun 1=Mon … 6=Sat
  const freq = habit.frequency || 'daily';

  if (freq === 'daily')    return true;
  if (freq === 'weekdays') return dow >= 1 && dow <= 5;
  if (freq === 'weekend')  return dow === 0 || dow === 6;
  if (freq === 'weekly')   return dow === 0;          // always Sunday
  if (freq === 'monthly') {
    // Last day of the month
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === lastDay;
  }
  return true;
};
