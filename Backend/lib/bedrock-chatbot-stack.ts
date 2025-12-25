import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface BedrockChatbotStackProps extends cdk.StackProps {
  readonly projectName?: string;
  readonly modelId?: string;
  readonly embeddingModelId?: string;
}

export class BedrockChatbotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockChatbotStackProps = {}) {
    super(scope, id, props);

    const projectName = props.projectName || 'abc';
    const modelId = props.modelId || 'anthropic.claude-3-haiku-20240307-v1:0';
    const embeddingModelId = props.embeddingModelId || 'amazon.titan-embed-text-v1';

    // ===== S3 Bucket for Documents =====
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `${projectName}-documents-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // ===== S3 Bucket for Supplemental Data Storage (Bedrock Data Automation) =====
    const supplementalBucket = new s3.Bucket(this, 'SupplementalBucket', {
      bucketName: `${projectName}-supplemental-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ===== S3 Bucket for Frontend Builds (Amplify) =====
    const buildsBucket = new s3.Bucket(this, 'BuildsBucket', {
      bucketName: `${projectName}-builds-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ===== Bedrock Knowledge Base Service Role =====
    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock Knowledge Base to access S3 and OpenSearch',
      inlinePolicies: {
        BedrockKnowledgeBasePolicy: new iam.PolicyDocument({
          statements: [
            // Bedrock model access for embeddings
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/${embeddingModelId}`,
              ],
            }),
            // Bedrock Data Automation access for advanced PDF parsing
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeDataAutomationAsync',
                'bedrock:GetDataAutomationStatus',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}:aws:data-automation-project/public-rag-default`,
                `arn:aws:bedrock:${this.region}:${this.account}:data-automation-project/*`,
              ],
            }),
            // S3 access for documents
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:ListBucket',
                's3:GetBucketLocation',
              ],
              resources: [
                documentsBucket.bucketArn,
                `${documentsBucket.bucketArn}/*`,
              ],
            }),
            // S3 access for supplemental data storage (Bedrock Data Automation)
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
                's3:GetBucketLocation',
              ],
              resources: [
                supplementalBucket.bucketArn,
                `${supplementalBucket.bucketArn}/*`,
              ],
            }),
            // OpenSearch Serverless access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'aoss:APIAccessAll',
                'aoss:DashboardsAccessAll',
              ],
              resources: ['*'], // Will be scoped after OpenSearch collection is created
            }),
          ],
        }),
      },
    });

    // Grant Bedrock service access to S3 bucket
    documentsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('bedrock.amazonaws.com')],
        actions: ['s3:GetObject', 's3:ListBucket', 's3:GetBucketLocation'],
        resources: [documentsBucket.bucketArn, `${documentsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
        },
      })
    );

    // ===== Lambda Execution Role =====
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        BedrockPolicy: new iam.PolicyDocument({
          statements: [
            // Bedrock model access for chat
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/${modelId}`,
                `arn:aws:bedrock:${this.region}::foundation-model/${embeddingModelId}`,
              ],
            }),
            // Bedrock Knowledge Base access
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:Retrieve',
                'bedrock:RetrieveAndGenerate',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
              ],
            }),
            // S3 access for documents
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
                's3:GetBucketLocation',
              ],
              resources: [
                documentsBucket.bucketArn,
                `${documentsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // ===== Data Ingestion Lambda Role =====
    const dataIngestionRole = new iam.Role(this, 'DataIngestionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DataIngestionPolicy: new iam.PolicyDocument({
          statements: [
            // Bedrock Agent access for Knowledge Base operations
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock-agent:StartIngestionJob',
                'bedrock-agent:GetIngestionJob',
                'bedrock-agent:ListIngestionJobs',
                'bedrock-agent:GetKnowledgeBase',
                'bedrock-agent:ListKnowledgeBases',
                'bedrock-agent:GetDataSource',
                'bedrock-agent:ListDataSources',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
                `arn:aws:bedrock:${this.region}:${this.account}:data-source/*`,
              ],
            }),
            // S3 access for document management
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
                's3:GetBucketLocation',
              ],
              resources: [
                documentsBucket.bucketArn,
                `${documentsBucket.bucketArn}/*`,
              ],
            }),
            // Web scraping permissions (for external URLs)
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ===== Chat Lambda Function =====
    const chatLambda = new lambda.Function(this, 'ChatLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        KNOWLEDGE_BASE_ID: 'PLACEHOLDER_KB_ID', // Will be updated after KB creation
        MODEL_ID: modelId,
        EMBEDDING_MODEL_ID: embeddingModelId,
        MAX_TOKENS: '1000',
        TEMPERATURE: '0.1',
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
      },
      description: 'America\'s Blood Centers Bedrock Chat Handler',
    });

    // ===== API Gateway =====
    const api = new apigateway.RestApi(this, 'ChatApi', {
      restApiName: `${projectName}-chat-api`,
      description: 'America\'s Blood Centers Bedrock Chat API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false,
        maxAge: cdk.Duration.hours(1),
      },
    });

    const chatIntegration = new apigateway.LambdaIntegration(chatLambda, {
      proxy: true,
      timeout: cdk.Duration.seconds(29),
    });

    api.root.addMethod('POST', chatIntegration);
    api.root.addMethod('GET', chatIntegration);

    // Add health check endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', chatIntegration);

    // ===== Data Ingestion Lambda =====
    const dataIngestionLambda = new lambda.Function(this, 'DataIngestionFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'data_ingestion.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: dataIngestionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
        KNOWLEDGE_BASE_ID: 'PLACEHOLDER_KB_ID', // Will be updated after KB creation
        DATA_SOURCE_ID: 'PLACEHOLDER_DS_ID', // Will be updated after DS creation
        S3_DATA_SOURCE_ID: 'PLACEHOLDER_S3_DS_ID', // Will be updated after S3 DS creation
        WEB_DATA_SOURCE_ID: 'PLACEHOLDER_WEB_DS_ID', // Will be updated after Web DS creation
      },
      description: 'Data ingestion and Knowledge Base management',
    });

    // Grant S3 permissions to data ingestion lambda
    documentsBucket.grantReadWrite(dataIngestionLambda);

    // ===== Daily Sync Schedule =====
    const dailySyncRule = new events.Rule(this, 'DailyDataSyncRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '19', // 7 PM UTC = 2 PM EST
        day: '*',
        month: '*',
        year: '*',
      }),
      description: 'Trigger daily data ingestion for blood supply status',
    });

    dailySyncRule.addTarget(
      new targets.LambdaFunction(dataIngestionLambda, {
        event: events.RuleTargetInput.fromObject({
          sync_type: 'daily',
          urls: ['https://americasblood.org/for-donors/americas-blood-supply/'],
        }),
      })
    );

    dataIngestionLambda.addPermission('AllowEventBridgeInvoke', {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      sourceArn: dailySyncRule.ruleArn,
    });

    // ===== Deploy Initial Documents =====
    // Deploy text files to root level (no folder)
    new s3deploy.BucketDeployment(this, 'DeployTextFiles', {
      sources: [s3deploy.Source.asset('./data-sources')],
      destinationBucket: documentsBucket,
      include: ['*.txt'],
      exclude: ['*.md', '*.pdf', '*.docx'],
    });

    // Deploy PDFs directly to pdfs/ folder (flattened structure)
    new s3deploy.BucketDeployment(this, 'DeployPDFs', {
      sources: [s3deploy.Source.asset('./data-sources/pdfs')],
      destinationBucket: documentsBucket,
      destinationKeyPrefix: 'pdfs/',
      include: ['*.pdf'],
      exclude: ['*.md', '*.txt'],
    });

    // Grant supplemental bucket access to Knowledge Base role
    supplementalBucket.grantReadWrite(knowledgeBaseRole);

    // Grant documents bucket access to data ingestion Lambda
    documentsBucket.grantReadWrite(dataIngestionLambda);
    supplementalBucket.grantReadWrite(dataIngestionLambda);

    // ===== Outputs =====
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'Chat API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: documentsBucket.bucketName,
      description: 'S3 Documents Bucket Name',
    });

    new cdk.CfnOutput(this, 'SupplementalBucketName', {
      value: supplementalBucket.bucketName,
      description: 'S3 Supplemental Data Storage Bucket Name',
    });

    new cdk.CfnOutput(this, 'BuildsBucketName', {
      value: buildsBucket.bucketName,
      description: 'S3 Frontend Builds Bucket Name',
    });

    new cdk.CfnOutput(this, 'KnowledgeBaseRoleArn', {
      value: knowledgeBaseRole.roleArn,
      description: 'Knowledge Base IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'ModelId', {
      value: modelId,
      description: 'Bedrock Foundation Model ID',
    });

    new cdk.CfnOutput(this, 'EmbeddingModelId', {
      value: embeddingModelId,
      description: 'Bedrock Embedding Model ID',
    });

    new cdk.CfnOutput(this, 'ChatLambdaFunctionName', {
      value: chatLambda.functionName,
      description: 'Chat Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DataIngestionFunctionName', {
      value: dataIngestionLambda.functionName,
      description: 'Data Ingestion Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'ProjectName', {
      value: projectName,
      description: 'Project Name for resource naming',
    });
  }
}