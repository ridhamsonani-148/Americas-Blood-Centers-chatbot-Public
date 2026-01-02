#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockChatbotStack } from '../lib/bedrock-chatbot-stack';

const app = new cdk.App();

new BedrockChatbotStack(app, 'AmericasBloodCentersBedrockStack', {
  projectName: app.node.tryGetContext('projectName') ,
  modelId: app.node.tryGetContext('modelId') ,
  embeddingModelId: app.node.tryGetContext('embeddingModelId'),
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ,
  },
  description: 'America\'s Blood Centers Chatbot using Bedrock Knowledge Base and Foundation Models',
  tags: {
    Project: 'AmericasBloodCenters',
    Environment: 'Production',
    Technology: 'Bedrock',
    CostCenter: 'IT',
  },
});