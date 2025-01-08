import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb';
import {
    DeleteCommand,
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    QueryCommandInput,
    ScanCommand, ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import {StudyRecord} from "../types/types";


export class StudyRepository {
    private docClient: DynamoDBDocumentClient;
    private readonly tableName = process.env.DYNAMODB_TABLE || 'study_tracking';

    constructor() {
        const client = new DynamoDBClient({
            credentials: {
                accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.DYNAMO_SECRET_ACCESS_KEY || ''
            },
            region: 'ap-northeast-2'
        } as DynamoDBClientConfig);
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    async save(record: StudyRecord): Promise<void> {
        await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: {
                pk: record.pk,  // 'YYYY-MM-DD' 형식의 인증 날짜
                sk: record.sk,
                username: record.username,
                tags: record.tags,
                timestamp: Date.now()
            }
        }));
    }

    async findByDateRange(startDate: string, endDate: string): Promise<StudyRecord[]> {
        const params: ScanCommandInput = {  // ScanCommandInput 타입 사용
            TableName: this.tableName,
            FilterExpression: "pk >= :startDate AND pk <= :endDate",
            ExpressionAttributeValues: {
                ":startDate": startDate,
                ":endDate": endDate
            }
        };

        const response = await this.docClient.send(new ScanCommand(params));
        return response.Items as StudyRecord[];
    }

}
