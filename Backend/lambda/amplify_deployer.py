import json
import boto3
import os
import logging
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
amplify = boto3.client('amplify')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Automated Amplify deployment handler
    Triggered by S3 upload events via EventBridge
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get environment variables
        amplify_app_id = os.environ.get('AMPLIFY_APP_ID')
        amplify_branch_name = os.environ.get('AMPLIFY_BRANCH_NAME', 'main')
        
        if not amplify_app_id or amplify_app_id == 'PLACEHOLDER_APP_ID':
            logger.error("AMPLIFY_APP_ID not configured")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'AMPLIFY_APP_ID not configured',
                    'message': 'Lambda environment variable AMPLIFY_APP_ID must be set'
                })
            }
        
        # Extract S3 details from event
        if 'bucket' in event and 'key' in event:
            # Direct invocation format
            bucket_name = event['bucket']
            object_key = event['key']
        elif 'Records' in event:
            # S3 event format
            record = event['Records'][0]
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
        else:
            logger.error("Invalid event format")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid event format',
                    'message': 'Event must contain S3 bucket and key information'
                })
            }
        
        logger.info(f"Processing deployment for bucket: {bucket_name}, key: {object_key}")
        
        # Verify the uploaded file is a build artifact
        if not object_key.startswith('builds/') or not object_key.endswith('.zip'):
            logger.info(f"Ignoring non-build file: {object_key}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'File ignored (not a build artifact)',
                    'file': object_key
                })
            }
        
        # Construct S3 URL for Amplify deployment
        source_url = f"s3://{bucket_name}/{object_key}"
        
        logger.info(f"Starting Amplify deployment for app {amplify_app_id}, branch {amplify_branch_name}")
        logger.info(f"Source URL: {source_url}")
        
        # Start Amplify deployment
        response = amplify.start_deployment(
            appId=amplify_app_id,
            branchName=amplify_branch_name,
            sourceUrl=source_url
        )
        
        job_id = response['jobSummary']['jobId']
        logger.info(f"Amplify deployment started successfully: {job_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Amplify deployment started successfully',
                'jobId': job_id,
                'appId': amplify_app_id,
                'branchName': amplify_branch_name,
                'sourceUrl': source_url,
                'deploymentUrl': f"https://{amplify_branch_name}.{amplify_app_id}.amplifyapp.com"
            })
        }
        
    except amplify.exceptions.NotFoundException:
        logger.error(f"Amplify app not found: {amplify_app_id}")
        return {
            'statusCode': 404,
            'body': json.dumps({
                'error': 'Amplify app not found',
                'appId': amplify_app_id,
                'message': 'The specified Amplify app does not exist'
            })
        }
        
    except amplify.exceptions.UnauthorizedException:
        logger.error("Unauthorized to access Amplify")
        return {
            'statusCode': 403,
            'body': json.dumps({
                'error': 'Unauthorized',
                'message': 'Lambda function does not have permission to access Amplify'
            })
        }
        
    except Exception as e:
        logger.error(f"Deployment failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Deployment failed',
                'message': str(e),
                'appId': amplify_app_id,
                'sourceUrl': source_url if 'source_url' in locals() else 'unknown'
            })
        }