// types/statistics.ts
import {StudyRepository} from "@repositories/studyRepository";

export type StatisticsPeriod = 'monthly' | 'weekly' | 'daily';

// handlers/statistics.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface StatResult {
    userStats: { [key: string]: number };
    tagStats: { [key: string]: number };
}

export const handler = async (event: any, context: any) => {
    const params = new URLSearchParams(event.body);
    const text = params.get('text') || 'monthly';
    const period = text as StatisticsPeriod;
    console.log("status :: period", period)
    const repository = new StudyRepository();

    const now = new Date();
    let startDate: Date = startOfDay(now);
    let title: string = '통계';

    switch(period) {
        case 'daily':
            startDate = startOfDay(now);
            title = '📍 오늘의 통계';
            break;
        case 'weekly':
            startDate = startOfWeek(now);
            title = '📅 이번 주 통계';
            break;
        case 'monthly':
            startDate = startOfMonth(now);
            title = '🗓 이번 달 통계';
            break;

    }

    // 기록 조회 및 통계 계산
    const allRecords = await repository.findByDateRange(startDate.toISOString(), now.toISOString());
    console.log("status :: allRecords", allRecords)
    const stats = calculateStats(allRecords, startDate);

    // 유저 정보 조회
    const userNames: { [key: string]: string } = {};
    for (const userId of Object.keys(stats.userStats)) {
        try {
            const userInfo = await slack.users.info({ user: userId });
            userNames[userId] = userInfo.user?.name || userId;
        } catch (error) {
            console.error(`Error fetching user info for ${userId}:`, error);
            userNames[userId] = userId;
        }
    }

    // 메시지 블록 구성
    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${title}*`
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: formatStats('👥 유저별 인증 횟수', stats.userStats, userNames)
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: formatStats('🏷 태그별 인증 횟수', stats.tagStats)
            }
        }
    ];

    console.log("status :: blocks", blocks)

    return blocks;
};

function calculateStats(records: any[], startDate: Date): StatResult {
    const userStats: { [key: string]: number } = {};
    const tagStats: { [key: string]: number } = {};

    records.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= startDate) {
            userStats[record.userId] = (userStats[record.userId] || 0) + 1;
            record.tags.forEach((tag: string) => {
                tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
        }
    });

    return { userStats, tagStats };
}

function formatStats(title: string, stats: { [key: string]: number }, userNames?: { [key: string]: string }): string {
    if (Object.keys(stats).length === 0) {
        return `*${title}*\n기록이 없습니다.`;
    }

    const entries = Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => {
            const displayName = userNames ? `<@${key}>` : key;  // 멘션 형식으로 변경
            return `• ${displayName}: ${value}회`;
        });

    return `*${title}*\n${entries.join('\n')}`;
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
    return new Date(d.setDate(diff));
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}