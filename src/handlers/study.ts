import { WebClient } from '@slack/web-api';
import { APIGatewayProxyEvent } from "aws-lambda";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface SlackCommandPayload {
    trigger_id: string;
    user_id: string;
    channel_id: string;
    text: string;
}

const parseBody = (body: string): SlackCommandPayload => {
    try {

        // URL 디코딩 후 payload 파싱
        const params = new URLSearchParams(body);
        const payloadStr = params.get('payload');

        if (payloadStr) {
            // 모달 제출 케이스
            const payload = JSON.parse(payloadStr);
            return {
                trigger_id: payload.trigger_id,
                user_id: payload.user.id,
                channel_id: payload.view.private_metadata,
                text: ''
            };
        } else {
            // 슬래시 커맨드 케이스
            return {
                trigger_id: params.get('trigger_id') || '',
                user_id: params.get('user_id') || '',
                channel_id: params.get('channel_id') || '',
                text: params.get('text') || ''
            };
        }
    } catch (error) {
        console.error('Parse error:', error);
        throw error;
    }
};
export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (!event.body) {
            throw new Error('Invalid request: No body');
        }

        const body = parseBody(event.body);

        console.log("[study :: body]", body)

        await slack.views.open({
            trigger_id: body.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'study_modal',
                private_metadata: body.channel_id,
                title: {
                    type: 'plain_text',
                    text: '학습 인증'
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'date_block',
                        label: {
                            type: 'plain_text',
                            text: '날짜'
                        },
                        element: {
                            type: 'datepicker',
                            initial_date: new Date().toISOString().split('T')[0],
                            action_id: 'date_input'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'tags_block',
                        label: {
                            type: 'plain_text',
                            text: '태그 선택'
                        },
                        element: {
                            type: 'multi_static_select',
                            placeholder: {
                                type: 'plain_text',
                                text: '태그를 선택하세요'
                            },
                            options: [
                                {
                                    text: { type: 'plain_text', text: '영어-스피킹' },
                                    value: '영어-스피킹'
                                },
                                {
                                    text: { type: 'plain_text', text: '영어-리스닝' },
                                    value: '영어-리스닝'
                                },
                                {
                                    text: { type: 'plain_text', text: '영어-라이팅' },
                                    value: '영어-라이팅'
                                },
                                {
                                    text: { type: 'plain_text', text: '영어-리딩' },
                                    value: '영어-리딩'
                                },
                                {
                                    text: { type: 'plain_text', text: '개발-프론트엔드' },
                                    value: '개발-프론트엔드'
                                },
                                {
                                    text: { type: 'plain_text', text: '개발-백엔드' },
                                    value: '개발-백엔드'
                                },
                                {
                                    text: { type: 'plain_text', text: '개발-인프라' },
                                    value: '개발-인프라'
                                }
                            ],
                            action_id: 'tags_input'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'content_block',
                        label: {
                            type: 'plain_text',
                            text: '인증 내용'
                        },
                        element: {
                            type: 'plain_text_input',
                            multiline: true,
                            action_id: 'content_input'
                        },
                        optional: true
                    },
                    {
                        type: 'input',
                        block_id: 'image_block',
                        label: {
                            type: 'plain_text',
                            text: '이미지'
                        },
                        element: {
                            type: 'file_input',
                            action_id: 'image_input',
                            filetypes: ['png', 'jpg', 'jpeg', 'gif']
                        },
                        optional: true
                    }
                ],
                submit: {
                    type: 'plain_text',
                    text: '인증하기'
                }
            }
        });
        console.log("[study :: body]", body)

        return {
            statusCode: 200,
            body: "오늘도 갓생 완료!"
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to open modal' })
        };
    }
};