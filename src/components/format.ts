/**
 * Sdílené formátovací helpery pro UI komponenty.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/** Formát mm:ss (s přidáním h: při přesahu přes hodinu). */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / MS_PER_SECOND);
  const hours = Math.floor(
    totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR),
  );
  const minutes = Math.floor(
    (totalSeconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)) /
      SECONDS_PER_MINUTE,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}
