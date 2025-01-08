import {StudyRepository} from '@repositories/studyRepository';
import {StatsPeriod, StudyRecord, StudyStats, UserStats} from "../types/types";
import {endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek} from "@utils/date";

export class StudyService {
    constructor(private repository: StudyRepository) {
    }

    async recordStudy(record: StudyRecord): Promise<void> {
        await this.repository.save(record);
    }

    /**
     * 지정된 기간의 학습 통계를 조회합니다.
     */
    async getStatistics(period: StatsPeriod, baseDate: Date = new Date()): Promise<StudyStats> {
        // 날짜 범위 계산
        const {startDate, endDate, title} = this.calculateDateRange(period, baseDate);
        const formattedStartDate = this.formatDate(startDate);
        const formattedEndDate = this.formatDate(endDate);

        // 해당 기간의 모든 기록 조회
        const records = await this.repository.findByDateRange(
            formattedStartDate,
            formattedEndDate
        );

        // 사용자별 통계 계산
        const userStatsMap = this.calculateUserStats(records);

        return {
            period,
            title,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            totalUsers: userStatsMap.size,
            userStats: Array.from(userStatsMap.values())
        };
    }

    /**
     * 통계 데이터를 보기 좋은 문자열로 포맷팅합니다.
     */
    formatStatistics(stats: StudyStats): string {
        const dateRange = stats.startDate === stats.endDate
            ? `📅 ${stats.startDate}`
            : `📅 ${stats.startDate} ~ ${stats.endDate}`;

        const userStatsFormatted = stats.userStats
            .map(userStat => {
                const tagStats = Object.entries(userStat.tagCounts)
                    .map(([tag, count]) => `${tag}: ${count}회`)
                    .join('\n');

                return `
*${userStat.username || userStat.userId}*
총 인증 횟수: ${userStat.totalCount}회
⎯⎯⎯ 유형별 통계 ⎯⎯⎯
${tagStats}`;
            })
            .join('\n\n');

        return `${stats.title}
${dateRange}
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
${userStatsFormatted}`;
    }

    /**
     * 특정 사용자의 통계만 조회합니다.
     */
    async getUserStatistics(userId: string, period: StatsPeriod, baseDate: Date = new Date()): Promise<UserStats | null> {
        const stats = await this.getStatistics(period, baseDate);
        return stats.userStats.find(stat => stat.userId === userId) || null;
    }

    /**
     * 학습 기록들로부터 사용자별 통계를 계산합니다.
     */
    private calculateUserStats(records: StudyRecord[]): Map<string, UserStats> {
        const userStatsMap = new Map<string, UserStats>();

        records.forEach(record => {
            if (!userStatsMap.has(record.sk)) {
                userStatsMap.set(record.sk, {
                    userId: record.sk,
                    username: record.username,
                    totalCount: 0,
                    tagCounts: {}
                });
            }

            const userStat = userStatsMap.get(record.sk)!;
            userStat.totalCount += 1;

            record.tags.forEach(tag => {
                userStat.tagCounts[tag] = (userStat.tagCounts[tag] || 0) + 1;
            });
        });

        return userStatsMap;
    }

    /**
     * 기간에 따른 날짜 범위와 제목을 계산합니다.
     */
    private calculateDateRange(period: StatsPeriod, baseDate: Date): {
        startDate: Date;
        endDate: Date;
        title: string;
    } {
        switch (period) {
            case 'daily':
                return {
                    startDate: startOfDay(baseDate),
                    endDate: endOfDay(baseDate),
                    title: '📍 오늘의 통계'
                };
            case 'weekly':
                return {
                    startDate: startOfWeek(baseDate), // 월요일부터 시작
                    endDate: endOfWeek(baseDate),
                    title: '📅 이번 주 통계'
                };
            case 'monthly':
                return {
                    startDate: startOfMonth(baseDate),
                    endDate: endOfMonth(baseDate),
                    title: '🗓 이번 달 통계'
                };
        }
    }

    /**
     * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
     */
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

}

