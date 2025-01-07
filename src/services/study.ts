import { StudyRepository, StudyRecord } from '@repositories/studyRepository';
import { getStartOfWeek, getStartOfMonth } from '@utils/date';

export class StudyService {
    constructor(private repository: StudyRepository) {}

    async recordStudy(record: StudyRecord): Promise<void> {
        await this.repository.save(record);
    }

    async deleteStudy(userId: string, date: string): Promise<void> {
        await this.repository.delete(userId, date);
    }

    private calculateStats(records: any[], startDate: Date): Record<string, number> {
        const stats: Record<string, number> = {};

        records.forEach(record => {
            const recordDate = new Date(record.pk.split('#')[1]);
            if (recordDate >= startDate) {
                record.tags.forEach((tag: string) => {
                    stats[tag] = (stats[tag] || 0) + 1;
                });
            }
        });

        return stats;
    }
}