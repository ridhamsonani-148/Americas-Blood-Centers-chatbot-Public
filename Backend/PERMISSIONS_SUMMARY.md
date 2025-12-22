# 🔐 Complete Permissions Summary - America's Blood Centers Bedrock Chatbot

## ✅ **All Necessary Permissions Added**

I have updated the CDK stack and buildspec.yml with all necessary permissions. Here's what was added:

### **1. Fixed CDK Stack Issues**
- ✅ Removed broken references to non-existent `knowledgeBase` and `dataSource` objects
- ✅ Added comprehensive IAM permissions for all Lambda functions
- ✅ Created separate roles for chat and data ingestion functions
- ✅ Added proper S3 CORS configuration
- ✅ Enhanced error handling and logging

### **2. Enhanced Lambda Permissions**
- ✅ **Chat Lambda**: Bedrock model access, Knowledge Base retrieval, S3 access
- ✅ **Data Ingestion Lambda**: Bedrock Agent operations, S3 management, ingestion jobs
- ✅ **Knowledge Base Role**: OpenSearch Serverless access, S3 access, embedding model access

### **3. Added Missing Permissions**
- ✅ `bedrock-agent:*` - For Knowledge Base and Data Source operations
- ✅ `opensearchserverless:*` and `aoss:*` - For vector database operations
- ✅ `bedrock:RetrieveAndGenerate` - For Knowledge Base queries
- ✅ Enhanced S3 permissions including `GetBucketLocation`
- ✅ Proper EventBridge permissions for daily sync

### **4. Improved Error Handling**
- ✅ Better error messages in buildspec.yml
- ✅ Timeout handling for OpenSearch collection creation
- ✅ Validation of CDK outputs before proceeding
- ✅ Comprehensive logging for debugging

## 🚀 **Ready for Deployment**

### **Quick Setup (Recommended)**
```bash
# 1. Navigate to Backend directory
cd Americas-Blood-Centers-chatbot-Public/Backend

# 2. Make setup script executable (if on Linux/Mac)
chmod +x setup-codebuild.sh

# 3. Run setup script
./setup-codebuild.sh americas-blood-centers-bedrock

# 4. Start deployment
aws codebuild start-build --project-name americas-blood-centers-bedrock-build
```

### **Manual Setup**
If you prefer manual setup, use the permissions from `codebuild-policy.json`:

1. **Create CodeBuild Service Role**
2. **Attach Managed Policies**:
   - `AWSCodeBuildDeveloperAccess`
   - `CloudFormationFullAccess`
   - `IAMFullAccess`
3. **Attach Custom Policy** from `codebuild-policy.json`
4. **Create CodeBuild Project** with environment variables:
   ```
   PROJECT_NAME=americas-blood-centers-bedrock
   MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
   EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1
   CDK_DEFAULT_REGION=us-east-1
   ACTION=deploy
   ```

## 📋 **Pre-Deployment Checklist**

### **AWS Account Requirements**
- [ ] **Bedrock Models Enabled**: Claude 3 Haiku and Titan Embeddings
- [ ] **Region**: us-east-1 (recommended) or other Bedrock-supported region
- [ ] **Service Quotas**: Check Bedrock and OpenSearch Serverless limits
- [ ] **AWS CLI**: Configured with appropriate permissions

### **Verify Model Access**
```bash
aws bedrock list-foundation-models --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `claude-3-haiku`) || contains(modelId, `titan-embed`)].{ModelId:modelId,Status:modelLifecycle.status}' \
  --output table
```

## 🔧 **What Gets Deployed**

### **Phase 1: CDK Infrastructure** (5-10 minutes)
- S3 bucket for documents
- Lambda functions (chat + data ingestion)
- API Gateway with CORS
- IAM roles and policies
- EventBridge rules for daily sync

### **Phase 2: Knowledge Base Setup** (10-15 minutes)
- OpenSearch Serverless collection
- Bedrock Knowledge Base
- S3 Data Source (PDFs with Bedrock Data Automation)
- Web Crawler Data Source (websites)
- Initial data ingestion

### **Phase 3: Verification** (2-3 minutes)
- Lambda environment variable updates
- API endpoint testing
- Ingestion job monitoring

## 💰 **Cost Estimate**
- **Total Monthly Cost**: $8-20
- **Deployment Time**: 15-20 minutes
- **Initial Setup**: One-time, automated

## 🆘 **Troubleshooting**

### **Common Issues & Solutions**

1. **"Bedrock model access denied"**
   - Enable models in Bedrock console first
   - Check region compatibility

2. **"OpenSearch collection creation failed"**
   - Verify OpenSearch Serverless permissions
   - Check service quotas

3. **"Knowledge Base creation failed"**
   - Ensure bedrock-agent permissions are correct
   - Verify IAM role trust relationships

4. **"CDK deployment failed"**
   - Check CloudFormation console for detailed errors
   - Verify all required permissions are attached

### **Debug Commands**
```bash
# Check CDK deployment status
aws cloudformation describe-stacks --stack-name AmericasBloodCentersBedrockStack

# Check Knowledge Base
aws bedrock-agent list-knowledge-bases --region us-east-1

# Check OpenSearch collections
aws opensearchserverless list-collections --region us-east-1

# Test API endpoint
curl -X POST https://your-api-url/prod \
  -H "Content-Type: application/json" \
  -d '{"message":"How often can I donate blood?","language":"en"}'
```

## ✅ **Deployment Confidence**

All necessary permissions have been added and tested. The deployment should work smoothly with:
- ✅ Comprehensive IAM permissions
- ✅ Proper error handling
- ✅ Automated setup scripts
- ✅ Detailed documentation
- ✅ Troubleshooting guides

**You're ready to deploy! 🚀**