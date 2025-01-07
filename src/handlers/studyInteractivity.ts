import {StudyRepository} from "@repositories/studyRepository";
import {StudyService} from "@services/study";
import {APIGatewayProxyEvent} from "aws-lambda";
import {WebClient} from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface SlackInteractionPayload {
    type: string;
    view: {
        callback_id: string;
        private_metadata: string;
        state: {
            values: {
                date_block: {
                    date_input: {
                        selected_date: string;
                    }
                },
                tags_block: {
                    tags_input: {
                        selected_options: Array<{ value: string }>;
                    }
                },
                content_block: {      // 텍스트 필드
                    content_input: {
                        value: string;
                    }
                },
                image_block: {
                    image_input: {
                        files: Array<{
                            id: string;
                            url_private: string;
                            name: string;
                            filetype: string;
                        }>;
                    }
                }
            }
        }
    };
    user: {
        id: string;
    };
    channel: {
        id: string;
    };
}

const parseBody = (body: string): SlackInteractionPayload => {
    const params = new URLSearchParams(body);
    const payloadStr = params.get('payload');

    if (!payloadStr) {
        throw new Error('No payload found');
    }

    const rawPayload = JSON.parse(payloadStr);

    return {
        type: rawPayload.type,
        view: {
            callback_id: rawPayload.view.callback_id,
            private_metadata: rawPayload.view.private_metadata,
            state: {
                values: {
                    date_block: {
                        date_input: {
                            selected_date: rawPayload.view.state.values.date_block.date_input.selected_date
                        }
                    },
                    tags_block: {
                        tags_input: {
                            selected_options: rawPayload.view.state.values.tags_block.tags_input.selected_options
                        }
                    },
                    content_block: {
                        content_input: {
                            value: rawPayload.view.state.values.content_block.content_input.value
                        }
                    },
                    image_block: {
                        image_input: {
                            files: rawPayload.view.state.values.image_block.image_input.files || []
                        }
                    }
                }
            }
        },
        user: {
            id: rawPayload.user.id
        },
        channel: {
            id: rawPayload.view.private_metadata || ''  // private_metadata에서 채널 ID 가져오기
        }
    };
};

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (!event.body) {
            throw new Error('Invalid request: No body');
        }

        const payload = parseBody(event.body);
        console.log('payload:', JSON.stringify(payload, null, 2));

        if (payload.type === 'view_submission' && payload.view.callback_id === 'study_modal') {
            const values = payload.view.state.values;
            const date = values.date_block.date_input.selected_date;
            const tags = values.tags_block.tags_input.selected_options.map(opt => opt.value);
            const content = values.content_block.content_input.value;
            const userInfo = await slack.users.info({
                user: payload.user.id
            });

            // DB에 저장
            const repository = new StudyRepository();
            const studyService = new StudyService(repository);
            await studyService.recordStudy({
                userId: payload.user.id,
                date,
                tags
            });

            let blocks: any[] = [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${userInfo.user?.profile?.display_name}님의 ${date} 인증이 완료되었습니다!*\n\n*태그:*\n${tags.join('\n')}`
                    }
                }
            ];

            const files = values.image_block.image_input.files;
            if (files && files.length > 0) {
                files.forEach(file => {
                    blocks.push({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '*인증 이미지:*\n$'
                        },
                        accessory: {
                            type: 'image',
                            image_url: file.url_private,
                            alt_text: '인증 이미지'
                        }
                    });
                });
            }

            // 텍스트 내용이 있으면 추가
            if (content) {
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*인증 내용:*\n${content}`
                    }
                });
            }

            await slack.chat.postMessage({
                channel: payload.channel.id,
                blocks: blocks,
                headers: {
                    Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
                },
                unfurl_media: false,  // 미디어 미리보기 비활성화
                unfurl_links: false   // 링크 미리보기 비활성화
            });
            return {
                statusCode: 200,
                body: ''
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({error: 'Invalid interaction type'})
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Failed to process interaction'})
        };
    }
};