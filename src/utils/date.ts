export function parseDate(dateStr?: string): Date {
    if (dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error('잘못된 날짜 형식입니다.');
        }
        return date;
    }

    const now = new Date();
    if (now.getHours() < 4) {
        now.setDate(now.getDate() - 1);
    }
    return now;
}

export function getStartOfWeek(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - date.getDay());
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
