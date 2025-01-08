export type StatsPeriod = 'daily' | 'weekly' | 'monthly';

export interface StudyRecord {
    pk: string;          // 날짜 (YYYY-MM-DD)
    sk: string;          // 유저 ID
    username: string;    // 유저 이름
    tags: string[];      // 학습 태그
    timestamp: number;   // 타임스탬프
}

export interface UserStats {
    userId: string;
    username: string;
    totalCount: number;
    tagCounts: Record<string, number>;
}

export interface StudyStats {
    period: StatsPeriod;
    title: string;
    startDate: string;
    endDate: string;
    totalUsers: number;
    userStats: UserStats[];
}
