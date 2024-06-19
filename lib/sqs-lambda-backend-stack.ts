import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {NodejsFunction,OutputFormat} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Queue, QueueEncryption} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {Duration} from "aws-cdk-lib";

export class SqsLambdaBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFn = new NodejsFunction(this, "hello-lambda", {
      functionName: "sqs-lambda",
      description: "A async lambda function with event source from SQS",
      runtime: Runtime.NODEJS_18_X,

      entry: "lambda/sqs-lambda.ts",
      // additional config for esbuild
      bundling: {
        // we want to use ESM instead of CJS
        format: OutputFormat.ESM
      }
    });

    const deadLetterQueue = new Queue(this, `dead-letter-queue`, {
      queueName: `dummy-dlq`,
      encryption: QueueEncryption.SQS_MANAGED,
      enforceSSL: true,
    });

    const queue = new Queue(this, `standard-queue`, {
      queueName: `main-queue`,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 2,
      },
      visibilityTimeout: Duration.seconds(20),
      receiveMessageWaitTime: Duration.seconds(10),
      encryption: QueueEncryption.SQS_MANAGED,
      enforceSSL: true,
    });

    const eventSource = new SqsEventSource(queue, {
      maxConcurrency: 3,
      batchSize: 2,
      maxBatchingWindow: Duration.seconds(10),
      reportBatchItemFailures: true,
    });

    lambdaFn.addEventSource(eventSource);

  }
}
