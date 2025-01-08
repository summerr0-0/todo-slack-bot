// date.utils.ts

/**
 * 주어진 날짜의 시작 시간을 반환 (00:00:00.000)
 */
export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 주어진 날짜의 마지막 시간을 반환 (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * 주어진 날짜가 속한 주의 시작일(월요일)을 반환
 */
export function startOfWeek(date: Date): Date {
    const day = date.getDay();
    // getDay()는 0(일요일)부터 시작하므로, 월요일을 시작으로 하려면 조정이 필요
    const diff = (day === 0 ? 6 : day - 1);
    const monday = new Date(date);
    monday.setDate(date.getDate() - diff);
    return startOfDay(monday);
}

/**
 * 주어진 날짜가 속한 주의 마지막일(일요일)을 반환
 */
export function endOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = (day === 0 ? 0 : 7 - day);
    const sunday = new Date(date);
    sunday.setDate(date.getDate() + diff);
    return endOfDay(sunday);
}

/**
 * 주어진 날짜가 속한 월의 첫 날을 반환
 */
export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 주어진 날짜가 속한 월의 마지막 날을 반환
 */
export function endOfMonth(date: Date): Date {
    return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}