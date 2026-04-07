import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** KST(UTC+9) 기준 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환 */
export function todayKST(): string {
  return dateToLogDate(new Date());
}

/** Date 객체를 KST 기준 "YYYY-MM-DD" 문자열로 변환 */
export function dateToLogDate(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}
