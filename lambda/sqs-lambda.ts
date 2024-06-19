import { SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
    serviceName: 'hello-lambda-handler',
});

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    logger.info('Got event', JSON.stringify(event));
    for (const record of event.Records) {
        try {
            const messageBody = JSON.parse(record.body);
            logger.info('Got record', JSON.stringify(record));
            // Check your condition here
            if (!conditionIsMet(messageBody)) {
                throw new Error('Condition not met');
            }

            // Process the message
            logger.info('Processing message:', messageBody);
            // Add your message processing logic here

        } catch (error) {
            logger.error(`Error : ${JSON.stringify(error)} ${record.messageId}`);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }

    return {
        batchItemFailures,
    };
};

// Dummy condition check function
const conditionIsMet = (messageBody: any): boolean => {
    // Implement your condition logic here
    return messageBody && messageBody.someField === 'expectedValue';
};
