// types/statistics.ts
import {StudyRepository} from "@repositories/studyRepository";

export type StatisticsPeriod = 'monthly' | 'weekly' | 'daily';

// handlers/statistics.ts
import {WebClient} from '@slack/web-api';
import {StudyService} from "@services/study";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface StatResult {
    userStats: { [key: string]: number };
    tagStats: { [key: string]: number };
}

export const handler = async (event: any, context: any) => {
    const params = new URLSearchParams(event.body);
    const text = params.get('text') || 'monthly';
    const repository = new StudyRepository();
    const studyService = new StudyService(repository);
    const period = text as StatisticsPeriod;
    console.log('period:', period)
    const channelId = params.get('channel_id')||'';
    console.log('channelId:', channelId)
    try {
        const statistics = await studyService.getStatistics(period);
        const formattedMessage = studyService.formatStatistics(statistics);

        // 슬랙 채널에 메시지 전송
        await slack.chat.postMessage({
            channel: channelId, // 또는 환경변수에서 가져온 채널 ID
            text: formattedMessage,
            markdown: true,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: formattedMessage
                    }
                }
            ]
        });

        return {
            statusCode: 200
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: '통계 조회 중 오류가 발생했습니다.'
        };
    }
};

