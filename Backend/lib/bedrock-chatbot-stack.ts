import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as os from 'os';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { opensearchserverless, opensearch_vectorindex } from '@cdklabs/generative-ai-cdk-constructs';
import { Construct } from 'constructs';

export interface BedrockChatbotStackProps extends cdk.StackProps {
  readonly projectName?: string;
  readonly modelId?: string;
  readonly embeddingModelId?: string;
}

export class BedrockChatbotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockChatbotStackProps = {}) {
    super(scope, id, props);

    const aws_region = cdk.Stack.of(this).region;
    const aws_account = cdk.Stack.of(this).account;
    console.log(`AWS Region: ${aws_region}`);

    const hostArchitecture = os.arch();
    console.log(`Host architecture: ${hostArchitecture}`);

    const lambdaArchitecture =
      hostArchitecture === "arm64"
        ? lambda.Architecture.ARM_64
        : lambda.Architecture.X86_64;
    console.log(`Lambda architecture: ${lambdaArchitecture}`);

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

    // Grant Amplify service access to builds bucket (critical for deployment)
    buildsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAmplifyServiceAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('amplify.amazonaws.com')],
        actions: [
          's3:GetObject',
          's3:GetObjectAcl',
          's3:GetObjectVersion',
          's3:GetObjectVersionAcl',
          's3:PutObjectAcl',
          's3:PutObjectVersionAcl',
          's3:ListBucket',
          's3:GetBucketAcl',
          's3:GetBucketLocation',
          's3:GetBucketVersioning',
          's3:GetBucketPolicy',
          's3:GetBucketPolicyStatus',
          's3:GetBucketPublicAccessBlock',
          's3:GetEncryptionConfiguration',
        ],
        resources: [buildsBucket.bucketArn, `${buildsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
        },
      })
    );

    // ===== Bedrock Knowledge Base Service Role =====
    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock Knowledge Base to access S3 and OpenSearch - Updated for Data Automation',
      // Remove explicit roleName to avoid conflicts and length issues
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
            // Bedrock Data Automation access for advanced PDF parsing - REGION AGNOSTIC
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeDataAutomationAsync',
                'bedrock:GetDataAutomationStatus',
                'bedrock:ListDataAutomationJobs',
              ],
              resources: [
                // Region-agnostic patterns to handle all regions
                `arn:aws:bedrock:*:${this.account}:data-automation-profile/*`,
                `arn:aws:bedrock:*:aws:data-automation-profile/*`,
                `arn:aws:bedrock:*:${this.account}:data-automation-project/*`,
                `arn:aws:bedrock:*:aws:data-automation-project/*`,
                // Wildcard for any data automation resources in any region
                `arn:aws:bedrock:*:*:data-automation-*/*`,
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

    // Add explicit trust policy to ensure Bedrock can assume the role
    knowledgeBaseRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('bedrock.amazonaws.com')],
        actions: ['sts:AssumeRole'],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
        },
      })
    );

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
                // Direct foundation model access
                `arn:aws:bedrock:${this.region}::foundation-model/${modelId}`,
                `arn:aws:bedrock:${this.region}::foundation-model/${embeddingModelId}`,
                // Support for all foundation models in current region
                `arn:aws:bedrock:${this.region}::foundation-model/*`,
                // Support for cross-region foundation models (needed for inference profiles)
                `arn:aws:bedrock:*::foundation-model/*`,
                // Support for global foundation models (no region specified)
                `arn:aws:bedrock:::foundation-model/*`,
                // Support for inference profiles
                `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
                `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
                // Support for cross-region inference profiles (global profiles)
                `arn:aws:bedrock:*::inference-profile/*`,
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
            // Additional Bedrock permissions for ingestion jobs
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:StartIngestionJob',
                'bedrock:GetIngestionJob',
                'bedrock:ListIngestionJobs',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
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

    // ========================================
    // OpenSearch Serverless Vector Collection (L2 Construct)
    // ========================================

    // Create OpenSearch Serverless Vector Collection using cdklabs L2 construct
    // This automatically creates encryption, network, and data access policies
    // Collection name will be auto-generated by CloudFormation
    const vectorCollection = new opensearchserverless.VectorCollection(this, "BloodCentersVectorCollection", {
      description: "Vector collection for America's Blood Centers Knowledge Base",
      standbyReplicas: opensearchserverless.VectorCollectionStandbyReplicas.DISABLED, // Cost optimization for dev
    });

    // Create Vector Index within the OpenSearch Serverless collection
    const vectorIndex = new opensearch_vectorindex.VectorIndex(this, "BloodCentersVectorIndex", {
      collection: vectorCollection,
      indexName: cdk.Names.uniqueResourceName(this, { maxLength: 63, separator: "-" }).toLowerCase(),
      vectorDimensions: 1536, // Amazon Titan Text Embeddings v1 dimension
      vectorField: "bedrock-knowledge-base-default-vector",
      precision: "float",
      distanceType: "l2",
      mappings: [
        {
          mappingField: "AMAZON_BEDROCK_TEXT_CHUNK",
          dataType: "text",
          filterable: true,
        },
        {
          mappingField: "AMAZON_BEDROCK_METADATA",
          dataType: "text",
          filterable: false,
        },
      ],
    });

    // ========================================
    // Knowledge Base with OpenSearch Serverless
    // ========================================

    // Amazon Titan Text Embeddings v1 model ARN
    const embeddingModelArn = `arn:aws:bedrock:${aws_region}::foundation-model/${embeddingModelId}`;

    // Create the Knowledge Base with OpenSearch Serverless vector store
    const knowledgeBase = new bedrock.CfnKnowledgeBase(this, "BloodCentersKnowledgeBase", {
      name: `BloodCentersKnowledgeBase-${cdk.Names.uniqueId(this).slice(-8)}`,
      description: "Knowledge base for America's Blood Centers containing blood donation information, eligibility criteria, and center locations",
      roleArn: knowledgeBaseRole.roleArn,
      knowledgeBaseConfiguration: {
        type: "VECTOR",
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: embeddingModelArn,
          embeddingModelConfiguration: {
            bedrockEmbeddingModelConfiguration: {
              dimensions: 1536, // Amazon Titan Text Embeddings v1 dimension
              embeddingDataType: "FLOAT32",
            },
          },
          // Supplemental data storage for multimodal content (images extracted from documents)
          supplementalDataStorageConfiguration: {
            supplementalDataStorageLocations: [
              {
                supplementalDataStorageLocationType: "S3",
                s3Location: {
                  uri: `s3://${supplementalBucket.bucketName}/`,
                },
              },
            ],
          },
        },
      },
      storageConfiguration: {
        type: "OPENSEARCH_SERVERLESS",
        opensearchServerlessConfiguration: {
          collectionArn: vectorCollection.collectionArn,
          vectorIndexName: vectorIndex.indexName,
          fieldMapping: {
            vectorField: vectorIndex.vectorField,
            textField: "AMAZON_BEDROCK_TEXT_CHUNK",
            metadataField: "AMAZON_BEDROCK_METADATA",
          },
        },
      },
    });

    // Ensure knowledge base is created after vector index and IAM policies are ready
    knowledgeBase.node.addDependency(vectorIndex);
    
    // Add explicit dependency on the IAM role's default policy to ensure permissions
    // are fully propagated before Knowledge Base creation attempts to validate them
    const defaultPolicyConstruct = knowledgeBaseRole.node.tryFindChild('DefaultPolicy');
    if (defaultPolicyConstruct) {
      const cfnPolicy = defaultPolicyConstruct.node.defaultChild as cdk.CfnResource;
      if (cfnPolicy) {
        knowledgeBase.addDependency(cfnPolicy);
      }
    }

    // ========================================
    // Data Source for Knowledge Base (S3)
    // ========================================

    const dataSource = new bedrock.CfnDataSource(this, "BloodCentersDataSource", {
      name: "BloodCentersDocuments-v2",
      description: "America's Blood Centers documents including donation guides, eligibility information, and blood supply data",
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      dataSourceConfiguration: {
        type: "S3",
        s3Configuration: {
          bucketArn: documentsBucket.bucketArn,
        },
      },
      vectorIngestionConfiguration: {
        // Fixed size chunking (default: 300 tokens, 20% overlap)
        chunkingConfiguration: {
          chunkingStrategy: "FIXED_SIZE",
          fixedSizeChunkingConfiguration: {
            maxTokens: 300,
            overlapPercentage: 20,
          },
        },
        // Use Bedrock Data Automation (BDA) for advanced document parsing
        parsingConfiguration: {
          parsingStrategy: "BEDROCK_DATA_AUTOMATION",
          bedrockDataAutomationConfiguration: {
            parsingModality: "MULTIMODAL",
          },
        },
      },
    });

    // Ensure data source is created after knowledge base
    dataSource.addDependency(knowledgeBase);

    // ========================================
    // Web Crawler Data Source for America's Blood Centers Website
    // ========================================
    const webCrawlerDataSource = new bedrock.CfnDataSource(this, "BloodCentersWebCrawlerDataSource", {
      name: "BloodCentersWebsite-v2",
      description: "Web crawler for America's Blood Centers website including donation information and blood center locations",
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      dataSourceConfiguration: {
        type: "WEB",
        webConfiguration: {
          sourceConfiguration: {
            urlConfiguration: {
              seedUrls: [
                { url: "https://americasblood.org/" },
                { url: "https://americasblood.org/for-donors/" },
                { url: "https://americasblood.org/for-donors/find-a-blood-center/" },
                { url: "https://americasblood.org/for-donors/americas-blood-supply/" },
              ],
            },
          },
          crawlerConfiguration: {
            crawlerLimits: {
              maxPages: 500, // Limit pages per seed URL to control costs
              rateLimit: 30, // Requests per minute to be respectful to servers
            },
          },
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: "FIXED_SIZE",
          fixedSizeChunkingConfiguration: {
            maxTokens: 500,
            overlapPercentage: 20,
          },
        },
        // Use Bedrock Data Automation (BDA) for advanced document parsing
        parsingConfiguration: {
          parsingStrategy: "BEDROCK_DATA_AUTOMATION",
          bedrockDataAutomationConfiguration: {
            parsingModality: "MULTIMODAL",
          },
        },
      },
    });

    // Ensure web crawler data source is created after knowledge base
    webCrawlerDataSource.addDependency(knowledgeBase);

    // Grant data access to the OpenSearch Serverless collection
    vectorCollection.grantDataAccess(knowledgeBaseRole);

    // Add OpenSearch Serverless API permissions for Knowledge Base
    knowledgeBaseRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["aoss:APIAccessAll"],
        resources: [vectorCollection.collectionArn],
      })
    );

    // ===== Chat Lambda Function =====
    const chatLambda = new lambda.Function(this, 'ChatLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        KNOWLEDGE_BASE_ID: knowledgeBase.attrKnowledgeBaseId,
        MODEL_ID: modelId,
        EMBEDDING_MODEL_ID: embeddingModelId,
        MAX_TOKENS: '1000', // Increased for better responses with Claude Sonnet
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

    // ===== Amplify Deployer Lambda =====
    const amplifyDeployerRole = new iam.Role(this, 'AmplifyDeployerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        AmplifyDeployerPolicy: new iam.PolicyDocument({
          statements: [
            // Amplify access for deployment
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'amplify:StartDeployment',
                'amplify:GetDeployment',
                'amplify:ListDeployments',
                'amplify:GetApp',
                'amplify:GetBranch',
                'amplify:ListApps',
                'amplify:ListBranches',
                'amplify:CreateDeployment',
                'amplify:UpdateApp',
                'amplify:UpdateBranch',
                // Additional permissions that might be needed for deployment
                'amplify:StartJob',
                'amplify:StopJob',
                'amplify:GetJob',
                'amplify:ListJobs',
              ],
              resources: [
                '*', // Amplify resources are dynamic, so we need wildcard
              ],
            }),
            // S3 access for build artifacts
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:GetObjectAcl',
                's3:GetObjectVersionAcl',
                's3:PutObjectAcl',
                's3:PutObjectVersionAcl',
                's3:ListBucket',
                's3:GetBucketAcl',
                's3:GetBucketLocation',
                's3:GetBucketVersioning',
                's3:PutBucketAcl',
                's3:ListBucketVersions',
                's3:GetBucketPolicy',
                's3:GetBucketPolicyStatus',
                's3:GetBucketPublicAccessBlock',
                's3:GetEncryptionConfiguration',
              ],
              resources: [
                buildsBucket.bucketArn,
                `${buildsBucket.bucketArn}/*`,
              ],
            }),
            // Additional IAM permissions that might be needed
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:PassRole',
                'iam:GetRole',
                'iam:ListRoles',
              ],
              resources: [
                `arn:aws:iam::${this.account}:role/amplifyconsole-*`,
                `arn:aws:iam::${this.account}:role/amplify-*`,
                `arn:aws:iam::${this.account}:role/service-role/amplifyconsole-*`,
              ],
            }),
            // CloudWatch Logs permissions (Amplify might need this)
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/amplify/*`,
              ],
            }),
          ],
        }),
      },
    });

    const amplifyDeployerLambda = new lambda.Function(this, 'AmplifyDeployerFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'amplify_deployer.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: amplifyDeployerRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: {
        AMPLIFY_BRANCH_NAME: 'main',
      },
      description: 'Automated Amplify deployment handler',
    });

    // Add explicit dependency to ensure Lambda is fully ready
    amplifyDeployerLambda.node.addDependency(buildsBucket);
    const dataIngestionLambda = new lambda.Function(this, 'DataIngestionFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'data_ingestion.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: dataIngestionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
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

    // Update Lambda environment variables with actual Knowledge Base ID
    chatLambda.addEnvironment('KNOWLEDGE_BASE_ID', knowledgeBase.attrKnowledgeBaseId);
    dataIngestionLambda.addEnvironment('KNOWLEDGE_BASE_ID', knowledgeBase.attrKnowledgeBaseId);
    dataIngestionLambda.addEnvironment('DATA_SOURCE_ID', dataSource.attrDataSourceId);
    dataIngestionLambda.addEnvironment('S3_DATA_SOURCE_ID', dataSource.attrDataSourceId);
    dataIngestionLambda.addEnvironment('WEB_DATA_SOURCE_ID', webCrawlerDataSource.attrDataSourceId);

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

    new cdk.CfnOutput(this, 'OpenSearchCollectionEndpoint', {
      value: vectorCollection.collectionEndpoint,
      description: 'OpenSearch Serverless Collection Endpoint',
    });

    new cdk.CfnOutput(this, 'KnowledgeBaseId', {
      value: knowledgeBase.attrKnowledgeBaseId,
      description: 'Bedrock Knowledge Base ID',
    });

    new cdk.CfnOutput(this, 'S3DataSourceId', {
      value: dataSource.attrDataSourceId,
      description: 'S3 Data Source ID for Knowledge Base',
    });

    new cdk.CfnOutput(this, 'WebDataSourceId', {
      value: webCrawlerDataSource.attrDataSourceId,
      description: 'Web Crawler Data Source ID for Knowledge Base',
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

    new cdk.CfnOutput(this, 'AmplifyDeployerFunctionName', {
      value: amplifyDeployerLambda.functionName,
      description: 'Amplify Deployer Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'ProjectName', {
      value: projectName,
      description: 'Project Name for resource naming',
    });
  }
}