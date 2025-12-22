#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockChatbotStack } from '../lib/bedrock-chatbot-stack';

const app = new cdk.App();

new BedrockChatbotStack(app, 'AmericasBloodCentersBedrockStack', {
  projectName: 'americas-blood-centers-bedrock',
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0', // Fast and cost-effective
  embeddingModelId: 'amazon.titan-embed-text-v1',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'America\'s Blood Centers Chatbot using Bedrock Knowledge Base and Foundation Models',
  tags: {
    Project: 'AmericasBloodCenters',
    Environment: 'Production',
    Technology: 'Bedrock',
    CostCenter: 'IT',
  },
});