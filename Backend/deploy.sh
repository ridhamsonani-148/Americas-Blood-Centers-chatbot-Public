#!/bin/bash

# America's Blood Centers Bedrock Chatbot Deployment Script
# This script uses the buildspec.yml approach for proper Knowledge Base creation

set -e

echo "🚀 Starting deployment of America's Blood Centers Bedrock Chatbot..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Set default environment variables
export PROJECT_NAME=${PROJECT_NAME:-"americas-blood-centers-bedrock"}
export MODEL_ID=${MODEL_ID:-"anthropic.claude-3-haiku-20240307-v1:0"}
export EMBEDDING_MODEL_ID=${EMBEDDING_MODEL_ID:-"amazon.titan-embed-text-v1"}
export ACTION=${ACTION:-"deploy"}
export CDK_DEFAULT_REGION=${CDK_DEFAULT_REGION:-$(aws configure get region)}

echo "📋 Configuration:"
echo "  Project Name: $PROJECT_NAME"
echo "  Model ID: $MODEL_ID"
echo "  Embedding Model: $EMBEDDING_MODEL_ID"
echo "  Region: $CDK_DEFAULT_REGION"
echo "  Action: $ACTION"
echo ""

# Run the buildspec commands locally
echo "🔧 Installing dependencies..."
npm install -g aws-cdk@latest
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "📦 Installing Lambda dependencies..."
cd lambda && pip install -r requirements.txt -t . && cd ..

echo "🚀 Bootstrapping CDK..."
cdk bootstrap --require-approval never

echo "🚀 Running deployment process..."

# Execute the main deployment logic from buildspec.yml
if [ "$ACTION" = "destroy" ]; then
    echo "🗑️ Destroying stack..."
    cdk destroy AmericasBloodCentersBedrockStack --force \
        --context projectName="$PROJECT_NAME" \
        --context modelId="$MODEL_ID" \
        --context embeddingModelId="$EMBEDDING_MODEL_ID"
    echo "✅ Stack destroyed successfully"
else
    echo "========================================="
    echo "Deploying America's Blood Centers Bedrock Chatbot"
    echo "========================================="
    
    echo "Deploying CDK stack (without KB)..."
    cdk deploy AmericasBloodCentersBedrockStack --require-approval never \
        --context projectName="$PROJECT_NAME" \
        --context modelId="$MODEL_ID" \
        --context embeddingModelId="$EMBEDDING_MODEL_ID" \
        --outputs-file outputs.json
    
    echo "Extracting outputs..."
    DOCUMENTS_BUCKET=$(cat outputs.json | jq -r '.AmericasBloodCentersBedrockStack.DocumentsBucketName // empty')
    KB_ROLE_ARN=$(cat outputs.json | jq -r '.AmericasBloodCentersBedrockStack.KnowledgeBaseRoleArn // empty')
    CHAT_LAMBDA_NAME=$(cat outputs.json | jq -r '.AmericasBloodCentersBedrockStack.ChatLambdaFunctionName // empty')
    DATA_INGESTION_LAMBDA_NAME=$(cat outputs.json | jq -r '.AmericasBloodCentersBedrockStack.DataIngestionFunctionName // empty')
    API_URL=$(cat outputs.json | jq -r '.AmericasBloodCentersBedrockStack.ApiGatewayUrl // empty')
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    echo ""
    echo "========================================="
    echo "Creating Knowledge Base Resources"
    echo "========================================="
    
    # Create OpenSearch Serverless Collection
    echo "Step 1: Creating OpenSearch Serverless collection..."
    COLLECTION_NAME="${PROJECT_NAME}-vectors"
    
    # Check if collection already exists
    COLLECTION_ARN=$(aws opensearchserverless list-collections \
        --region "$CDK_DEFAULT_REGION" \
        --query "collectionSummaries[?name=='$COLLECTION_NAME'].arn | [0]" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$COLLECTION_ARN" ] && [ "$COLLECTION_ARN" != "None" ] && [ "$COLLECTION_ARN" != "null" ]; then
        echo "✓ Found existing collection: $COLLECTION_ARN"
    else
        echo "Creating OpenSearch Serverless policies and collection..."
        
        # Create policies (ignore errors if they already exist)
        aws opensearchserverless create-security-policy \
            --name "${PROJECT_NAME}-network-policy" \
            --type network \
            --policy '[{"Rules":[{"Resource":["collection/'$COLLECTION_NAME'"],"ResourceType":"collection"}],"AllowFromPublic":true}]' \
            --region "$CDK_DEFAULT_REGION" 2>/dev/null || echo "Network policy may already exist"
        
        aws opensearchserverless create-security-policy \
            --name "${PROJECT_NAME}-encryption-policy" \
            --type encryption \
            --policy '{"Rules":[{"Resource":["collection/'$COLLECTION_NAME'"],"ResourceType":"collection"}],"AWSOwnedKey":true}' \
            --region "$CDK_DEFAULT_REGION" 2>/dev/null || echo "Encryption policy may already exist"
        
        aws opensearchserverless create-access-policy \
            --name "${PROJECT_NAME}-data-access-policy" \
            --type data \
            --policy '[{"Rules":[{"Resource":["collection/'$COLLECTION_NAME'"],"Permission":["aoss:CreateCollectionItems","aoss:DeleteCollectionItems","aoss:UpdateCollectionItems","aoss:DescribeCollectionItems"],"ResourceType":"collection"},{"Resource":["index/'$COLLECTION_NAME'/*"],"Permission":["aoss:CreateIndex","aoss:DeleteIndex","aoss:UpdateIndex","aoss:DescribeIndex","aoss:ReadDocument","aoss:WriteDocument"],"ResourceType":"index"}],"Principal":["'$AWS_ACCOUNT_ID'"]}]' \
            --region "$CDK_DEFAULT_REGION" 2>/dev/null || echo "Data access policy may already exist"
        
        sleep 10
        
        COLLECTION_ARN=$(aws opensearchserverless create-collection \
            --name "$COLLECTION_NAME" \
            --type VECTORSEARCH \
            --description "Vector collection for America's Blood Centers knowledge base" \
            --region "$CDK_DEFAULT_REGION" \
            --query 'createCollectionDetail.arn' --output text)
        
        echo "✓ Collection created: $COLLECTION_ARN"
    fi
    
    # Wait for collection to be active
    echo "Step 2: Waiting for collection to be active..."
    while true; do
        STATUS=$(aws opensearchserverless list-collections \
            --region "$CDK_DEFAULT_REGION" \
            --query "collectionSummaries[?name=='$COLLECTION_NAME'].status | [0]" \
            --output text 2>/dev/null || echo "ERROR")
        
        echo "  Collection status: $STATUS"
        
        if [ "$STATUS" = "ACTIVE" ]; then
            echo "✓ Collection is active"
            break
        elif [ "$STATUS" = "FAILED" ]; then
            echo "✗ Collection creation failed"
            exit 1
        fi
        
        sleep 30
    done
    
    # Create Knowledge Base
    echo "Step 3: Creating Bedrock Knowledge Base..."
    KB_ID=$(aws bedrock-agent list-knowledge-bases \
        --region "$CDK_DEFAULT_REGION" \
        --query "knowledgeBaseSummaries[?name=='${PROJECT_NAME}-knowledge-base'].knowledgeBaseId | [0]" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$KB_ID" ] && [ "$KB_ID" != "None" ] && [ "$KB_ID" != "null" ]; then
        echo "✓ Found existing Knowledge Base: $KB_ID"
    else
        KB_ID=$(aws bedrock-agent create-knowledge-base \
            --name "${PROJECT_NAME}-knowledge-base" \
            --description "Knowledge base for America's Blood Centers chatbot" \
            --role-arn "$KB_ROLE_ARN" \
            --knowledge-base-configuration '{
                "type": "VECTOR",
                "vectorKnowledgeBaseConfiguration": {
                    "embeddingModelArn": "arn:aws:bedrock:'"$CDK_DEFAULT_REGION"'::foundation-model/'"$EMBEDDING_MODEL_ID"'"
                }
            }' \
            --storage-configuration '{
                "type": "OPENSEARCH_SERVERLESS",
                "opensearchServerlessConfiguration": {
                    "collectionArn": "'"$COLLECTION_ARN"'",
                    "vectorIndexName": "bedrock-knowledge-base-default-index",
                    "fieldMapping": {
                        "vectorField": "bedrock-knowledge-base-default-vector",
                        "textField": "AMAZON_BEDROCK_TEXT_CHUNK",
                        "metadataField": "AMAZON_BEDROCK_METADATA"
                    }
                }
            }' \
            --region "$CDK_DEFAULT_REGION" \
            --query 'knowledgeBase.knowledgeBaseId' --output text)
        
        echo "✓ Knowledge Base created: $KB_ID"
    fi
    
    # Create Data Source
    echo "Step 4: Creating Data Source..."
    BUCKET_ARN="arn:aws:s3:::${DOCUMENTS_BUCKET}"
    
    DS_ID=$(aws bedrock-agent list-data-sources \
        --knowledge-base-id "$KB_ID" \
        --region "$CDK_DEFAULT_REGION" \
        --query "dataSourceSummaries[?name=='blood-centers-documents'].dataSourceId | [0]" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$DS_ID" ] && [ "$DS_ID" != "None" ] && [ "$DS_ID" != "null" ]; then
        echo "✓ Found existing Data Source: $DS_ID"
    else
        DS_ID=$(aws bedrock-agent create-data-source \
            --name "blood-centers-documents" \
            --description "Blood donation documents and web content" \
            --knowledge-base-id "$KB_ID" \
            --data-source-configuration '{
                "type": "S3",
                "s3Configuration": {
                    "bucketArn": "'"$BUCKET_ARN"'",
                    "inclusionPrefixes": ["documents/"]
                }
            }' \
            --vector-ingestion-configuration '{
                "chunkingConfiguration": {
                    "chunkingStrategy": "FIXED_SIZE",
                    "fixedSizeChunkingConfiguration": {
                        "maxTokens": 512,
                        "overlapPercentage": 20
                    }
                }
            }' \
            --region "$CDK_DEFAULT_REGION" \
            --query 'dataSource.dataSourceId' --output text)
        
        echo "✓ Data Source created: $DS_ID"
    fi
    
    # Upload initial documents
    echo "Step 5: Uploading initial documents..."
    aws s3 cp data-sources/ s3://$DOCUMENTS_BUCKET/documents/ --recursive --exclude "*.md"
    
    # Update Lambda environment variables
    echo "Step 6: Updating Lambda environment variables..."
    
    # Update chat Lambda
    CHAT_ENV=$(aws lambda get-function-configuration \
        --function-name "$CHAT_LAMBDA_NAME" \
        --region "$CDK_DEFAULT_REGION" \
        --query 'Environment.Variables' \
        --output json)
    
    echo "$CHAT_ENV" | jq \
        --arg kb_id "$KB_ID" \
        '{Variables: (. + {KNOWLEDGE_BASE_ID: $kb_id})}' > /tmp/chat_env.json
    
    aws lambda update-function-configuration \
        --function-name "$CHAT_LAMBDA_NAME" \
        --environment file:///tmp/chat_env.json \
        --region "$CDK_DEFAULT_REGION" >/dev/null
    
    # Update data ingestion Lambda
    DATA_ENV=$(aws lambda get-function-configuration \
        --function-name "$DATA_INGESTION_LAMBDA_NAME" \
        --region "$CDK_DEFAULT_REGION" \
        --query 'Environment.Variables' \
        --output json)
    
    echo "$DATA_ENV" | jq \
        --arg kb_id "$KB_ID" \
        --arg ds_id "$DS_ID" \
        '{Variables: (. + {KNOWLEDGE_BASE_ID: $kb_id, DATA_SOURCE_ID: $ds_id})}' > /tmp/data_env.json
    
    aws lambda update-function-configuration \
        --function-name "$DATA_INGESTION_LAMBDA_NAME" \
        --environment file:///tmp/data_env.json \
        --region "$CDK_DEFAULT_REGION" >/dev/null
    
    echo "✓ Lambda environment variables updated"
    
    # Trigger initial data ingestion
    echo "Step 7: Triggering initial data ingestion..."
    aws lambda invoke \
        --function-name "$DATA_INGESTION_LAMBDA_NAME" \
        --payload '{"sync_type":"initial","urls":["https://americasblood.org/for-donors/americas-blood-supply/","https://americasblood.org/for-donors/find-a-blood-center/","https://americasblood.org/news/","https://americasblood.org/newsroom/"]}' \
        --region "$CDK_DEFAULT_REGION" \
        /tmp/ingestion_response.json
    
    # Start ingestion job
    INGESTION_JOB_ID=$(aws bedrock-agent start-ingestion-job \
        --knowledge-base-id "$KB_ID" \
        --data-source-id "$DS_ID" \
        --description "Initial ingestion of blood donation documents" \
        --region "$CDK_DEFAULT_REGION" \
        --query 'ingestionJob.ingestionJobId' --output text)
    
    echo "✓ Ingestion job started: $INGESTION_JOB_ID"
    
    echo ""
    echo "========================================="
    echo "✅ Deployment Complete!"
    echo "========================================="
    echo "🔗 API Gateway URL: $API_URL"
    echo "🧠 Knowledge Base ID: $KB_ID"
    echo "📁 Documents Bucket: $DOCUMENTS_BUCKET"
    echo "🔄 Ingestion Job ID: $INGESTION_JOB_ID"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Wait 5-10 minutes for ingestion job to complete"
    echo "2. Test the API:"
    echo "   curl -X POST $API_URL -H 'Content-Type: application/json' -d '{\"message\":\"How many people donate blood?\",\"language\":\"en\"}'"
    echo "3. Test Spanish support:"
    echo "   curl -X POST $API_URL -H 'Content-Type: application/json' -d '{\"message\":\"¿Cuántas personas donan sangre?\",\"language\":\"es\"}'"
    echo ""
    echo "💰 Estimated monthly cost: \$8-20 (vs \$20+ for Q Business)"
    echo "🎉 Happy chatting!"
fi