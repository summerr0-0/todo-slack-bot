import {DynamoDBClient, DynamoDBClientConfig} from '@aws-sdk/client-dynamodb';
import {DeleteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand} from '@aws-sdk/lib-dynamodb';

export interface StudyRecord {
    userId: string;
    date: string;
    tags: string[];
    timestamp?: number;
}

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
        const recordDate = new Date(record.date);
        await this.docClient.send(new PutCommand({
            TableName: this.tableName,
            Item: {
                pk: `${record.userId}#${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`, // YYYY-MM 형식
                sk: record.date, // 상세 날짜를 정렬 키로
                tags: record.tags,
                userId: record.userId,
                date: record.date,
                timestamp: Date.now()
            }
        }));
    }

    async findByDateRange(startDate: string, endDate: string): Promise<StudyRecord[]> {
        console.log('Finding records between:', startDate, endDate);

        const response = await this.docClient.send(new ScanCommand({
            TableName: this.tableName,
            FilterExpression: 'sk BETWEEN :start AND :end',
            ExpressionAttributeValues: {
                ':start': startDate,
                ':end': endDate
            }
        }));

        console.log('Raw scan response:', JSON.stringify(response.Items, null, 2));

        const filteredItems = (response.Items || [])
            .map(item => ({
                userId: item.userId,
                date: item.date,
                tags: item.tags,
                timestamp: item.timestamp
            } as StudyRecord));

        console.log('Filtered items:', filteredItems.length);

        return filteredItems;
    }

}
