# Deployment Checklist - America's Blood Centers Bedrock Chatbot

## 🔐 **Required Permissions for CodeBuild**

### **1. CodeBuild Service Role**
Create a CodeBuild service role with the following managed policies:
- `AWSCodeBuildDeveloperAccess`
- `CloudFormationFullAccess`
- `IAMFullAccess`

### **2. Custom Policy for Bedrock/OpenSearch**
Attach the custom policy from `codebuild-policy.json` to your CodeBuild service role.

### **3. Bedrock Model Access**
Ensure these models are enabled in your AWS account:
- `anthropic.claude-3-haiku-20240307-v1:0` (Chat model)
- `amazon.titan-embed-text-v1` (Embedding model)

**Check model availability:**
```bash
aws bedrock list-foundation-models --region us-east-1
```

## 🌍 **Regional Requirements**

### **Supported Regions for Bedrock**
- `us-east-1` (N. Virginia) - **RECOMMENDED**
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)

### **Update Region in Files**
If not using `us-east-1`, update:
- `bedrock-stack.ts`: `CDK_DEFAULT_REGION`
- `buildspec.yml`: Environment variables

## 📋 **Pre-Deployment Steps**

### **1. AWS Account Setup**
- [ ] AWS CLI configured with appropriate permissions
- [ ] Bedrock models enabled (Claude 3 Haiku + Titan Embeddings)
- [ ] Service quotas checked (Bedrock, OpenSearch Serverless)
- [ ] Region selected (us-east-1 recommended)

### **2. CodeBuild Project Setup**
- [ ] CodeBuild project created
- [ ] Service role attached with required permissions
- [ ] Environment variables configured (see below)

### **3. Environment Variables for CodeBuild**
```bash
PROJECT_NAME=americas-blood-centers-bedrock
MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1
CDK_DEFAULT_REGION=us-east-1
ACTION=deploy
```

## 🚀 **Deployment Process**

### **Phase 1: CDK Infrastructure**
```bash
cd Backend
npm install
cdk bootstrap --require-approval never
cdk deploy AmericasBloodCentersBedrockStack --require-approval never
```

### **Phase 2: Knowledge Base Setup** (Automated in buildspec.yml)
1. Create OpenSearch Serverless collection
2. Create Bedrock Knowledge Base
3. Create S3 Data Source (PDFs)
4. Create Web Crawler Data Source (Websites)
5. Update Lambda environment variables
6. Start initial ingestion jobs

### **Phase 3: Verification**
1. Check Knowledge Base creation
2. Verify data source ingestion
3. Test API endpoints
4. Monitor CloudWatch logs

## 🔍 **Verification Commands**

### **1. Check Knowledge Base**
```bash
aws bedrock-agent list-knowledge-bases --region us-east-1
```

### **2. Check Data Sources**
```bash
KB_ID="your-kb-id"
aws bedrock-agent list-data-sources --knowledge-base-id $KB_ID --region us-east-1
```

### **3. Test API**
```bash
API_URL="your-api-url"
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"How often can I donate blood?","language":"en"}'
```

## 🚨 **Common Issues & Solutions**

### **1. Bedrock Model Access Denied**
**Solution**: Enable models in Bedrock console
```bash
# Check model status
aws bedrock get-foundation-model --model-identifier anthropic.claude-3-haiku-20240307-v1:0
```

### **2. OpenSearch Collection Creation Failed**
**Solution**: Check OpenSearch Serverless permissions and quotas
```bash
# Check collections
aws opensearchserverless list-collections --region us-east-1
```

### **3. Knowledge Base Creation Failed**
**Solution**: Verify bedrock-agent permissions and IAM role
```bash
# Check IAM role
aws iam get-role --role-name YourKnowledgeBaseRole
```

### **4. Lambda Environment Update Failed**
**Solution**: Check Lambda permissions and function existence
```bash
# Check Lambda function
aws lambda get-function --function-name YourChatLambdaFunction
```

## 💰 **Cost Monitoring**

### **Expected Monthly Costs**
- OpenSearch Serverless: $2-5
- Claude 3 Haiku: $3-8
- Titan Embeddings: $1-2
- Lambda Functions: $1-2
- API Gateway: $1-2
- S3 Storage: <$1
- **Total**: $8-20/month

### **Cost Optimization**
- Use Claude 3 Haiku (most cost-effective)
- Monitor OpenSearch Serverless usage
- Set up billing alerts

## 📊 **Monitoring & Logging**

### **CloudWatch Log Groups**
- `/aws/lambda/AmericasBloodCentersBedrockStack-ChatLambdaFunction-*`
- `/aws/lambda/AmericasBloodCentersBedrockStack-DataIngestionFunction-*`
- `/aws/apigateway/AmericasBloodCentersBedrockStack-ChatApi-*`

### **Key Metrics to Monitor**
- Lambda invocation count and duration
- API Gateway request count and latency
- Bedrock model invocation count
- Knowledge Base retrieval success rate

## 🔄 **Post-Deployment Tasks**

### **1. Frontend Deployment**
- Update `Frontend/src/utilities/constants.js` with API URL
- Deploy to AWS Amplify

### **2. Data Population**
- Upload PDFs to S3 bucket (`pdfs/` prefix)
- Trigger web crawler for initial content
- Monitor ingestion job progress

### **3. Testing**
- Test English and Spanish queries
- Verify source attribution
- Check admin dashboard functionality

## 📞 **Support**

If deployment fails:
1. Check CloudWatch logs for detailed error messages
2. Verify all permissions are correctly configured
3. Ensure Bedrock models are enabled in your region
4. Check service quotas and limits

**Remember**: The deployment creates many AWS resources, so having comprehensive permissions initially prevents deployment failures.