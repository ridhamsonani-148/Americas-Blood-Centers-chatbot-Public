"""
Data Ingestion Lambda for America's Blood Centers Bedrock Chatbot
Handles PDF processing for Knowledge Base S3 Data Source
Web crawling is handled automatically by Web Crawler Data Source
"""

import json
import boto3
import logging
import os
import requests
from datetime import datetime
from typing import Dict, List, Any
import urllib.parse

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
bedrock_agent = boto3.client('bedrock-agent')

# Environment variables
DOCUMENTS_BUCKET = os.environ.get('DOCUMENTS_BUCKET')
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
S3_DATA_SOURCE_ID = os.environ.get('S3_DATA_SOURCE_ID')
WEB_DATA_SOURCE_ID = os.environ.get('WEB_DATA_SOURCE_ID')
DAILY_SYNC_DATA_SOURCE_ID = os.environ.get('DAILY_SYNC_DATA_SOURCE_ID')
# Backward compatibility
DATA_SOURCE_ID = os.environ.get('DATA_SOURCE_ID', S3_DATA_SOURCE_ID)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for data ingestion - supports dual data sources:
    1. S3 Data Source: PDFs with Bedrock Data Automation parser
    2. Web Crawler Data Source: Websites with automatic crawling
    """
    try:
        logger.info(f"Starting data ingestion: {json.dumps(event)}")
        
        sync_type = event.get('sync_type', 'manual')
        data_source_type = event.get('data_source_type', 'both')  # 'both', 's3', 'web'
        urls = event.get('urls', [])
        
        results = {
            's3_ingestion_job': None,
            'web_ingestion_job': None,
            'daily_sync_job': None,
            'pdfs_processed': 0,
            'urls_noted': len(urls)
        }
        
        # Process PDFs for S3 data source (if requested)
        if sync_type in ['initial', 'manual'] and data_source_type in ['both', 's3']:
            # Process PDFs from URLs in urls.txt
            pdf_results = process_pdfs_for_s3()
            results['pdfs_processed'] = len(pdf_results.get('processed', []))
            
            # Also process any manual PDFs uploaded to data-sources/ folder
            manual_pdf_results = process_manual_pdfs_from_s3()
            results['manual_pdfs_processed'] = len(manual_pdf_results.get('processed', []))
            
            logger.info(f"Total PDFs processed: {results['pdfs_processed']} from URLs, {results['manual_pdfs_processed']} manual uploads")
        
        # Note: Web crawling is handled automatically by Web Crawler Data Source
        # The Web Crawler Data Source will automatically crawl the seed URLs configured in buildspec.yml
        if urls and data_source_type in ['both', 'web']:
            logger.info(f"URLs will be crawled automatically by Web Crawler Data Source: {urls}")
            logger.info("No manual web scraping needed - Web Crawler Data Source handles this automatically")
        
        # Start ingestion jobs based on data source type and sync type
        if data_source_type in ['both', 's3'] and S3_DATA_SOURCE_ID:
            try:
                s3_job = start_ingestion_job(
                    S3_DATA_SOURCE_ID, 
                    f"{sync_type} ingestion of PDF documents"
                )
                results['s3_ingestion_job'] = s3_job.get('ingestionJobId')
                logger.info(f"Started S3 ingestion job: {results['s3_ingestion_job']}")
            except Exception as e:
                logger.error(f"Failed to start S3 ingestion job: {str(e)}")
        
        if data_source_type in ['both', 'web']:
            # For daily sync, use the dedicated daily sync data source
            if sync_type == 'daily' and DAILY_SYNC_DATA_SOURCE_ID:
                try:
                    daily_job = start_ingestion_job(
                        DAILY_SYNC_DATA_SOURCE_ID, 
                        f"Daily sync of specific blood donation pages"
                    )
                    results['daily_sync_job'] = daily_job.get('ingestionJobId')
                    logger.info(f"Started Daily Sync ingestion job: {results['daily_sync_job']}")
                except Exception as e:
                    logger.error(f"Failed to start Daily Sync ingestion job: {str(e)}")
            # For other sync types, use the main web crawler
            elif WEB_DATA_SOURCE_ID:
                try:
                    web_job = start_ingestion_job(
                        WEB_DATA_SOURCE_ID, 
                        f"{sync_type} crawling of America's Blood Centers websites"
                    )
                    results['web_ingestion_job'] = web_job.get('ingestionJobId')
                    logger.info(f"Started Web Crawler ingestion job: {results['web_ingestion_job']}")
                except Exception as e:
                    logger.error(f"Failed to start Web Crawler ingestion job: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Data ingestion completed successfully',
                'sync_type': sync_type,
                'data_source_type': data_source_type,
                'results': results,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Data ingestion failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Data ingestion failed',
                'details': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }

def process_pdfs_for_s3() -> Dict[str, Any]:
    """
    Download and process PDFs for S3 data source with Bedrock Data Automation parser
    Reads PDF URLs from urls.txt file instead of hardcoded list
    """
    results = {'processed': [], 'failed': []}
    
    # Get PDF URLs from urls.txt file
    pdf_urls = get_pdf_urls_from_file()
    
    if not pdf_urls:
        logger.warning("No PDF URLs found in urls.txt file")
        return results
    
    logger.info(f"Found {len(pdf_urls)} PDF URLs to process")
    
    for pdf_url in pdf_urls:
        try:
            logger.info(f"Processing PDF for S3 data source: {pdf_url}")
            
            # Download PDF
            pdf_content = download_pdf(pdf_url)
            
            if pdf_content:
                # Save PDF to S3 under pdfs/ prefix for Bedrock Data Automation parser
                pdf_filename = get_url_filename(pdf_url) + '.pdf'
                pdf_key = f"pdfs/{pdf_filename}"
                
                save_pdf_to_s3(pdf_content, pdf_key, {
                    'source_url': pdf_url,
                    'download_date': datetime.utcnow().isoformat(),
                    'content_type': 'pdf_document',
                    'title': extract_title_from_url(pdf_url),
                    'data_source': 's3_bedrock_automation'
                })
                
                results['processed'].append({
                    'url': pdf_url,
                    's3_key': pdf_key,
                    'size_bytes': len(pdf_content),
                    'title': extract_title_from_url(pdf_url)
                })
                
                logger.info(f"Successfully processed PDF: {pdf_url}")
            else:
                results['failed'].append({
                    'url': pdf_url,
                    'error': 'Failed to download PDF content'
                })
                
        except Exception as e:
            logger.error(f"Failed to process PDF {pdf_url}: {str(e)}")
            results['failed'].append({
                'url': pdf_url,
                'error': str(e)
            })
    
    logger.info(f"PDF processing complete: {len(results['processed'])} processed, {len(results['failed'])} failed")
    return results

def process_manual_pdfs_from_s3() -> Dict[str, Any]:
    """
    Process any PDF files that were manually uploaded to the data-sources/ folder
    These get uploaded to S3 during deployment via buildspec.yml
    """
    results = {'processed': [], 'failed': []}
    
    try:
        # List PDF files in the data-sources/ prefix (uploaded during deployment)
        response = s3_client.list_objects_v2(
            Bucket=DOCUMENTS_BUCKET,
            Prefix='data-sources/',
            Delimiter='/'
        )
        
        for obj in response.get('Contents', []):
            key = obj['Key']
            
            # Check if it's a PDF file
            if key.lower().endswith('.pdf'):
                try:
                    logger.info(f"Processing manual PDF: {key}")
                    
                    # Copy from data-sources/ to pdfs/ prefix for S3 data source
                    pdf_filename = key.split('/')[-1]  # Get just the filename
                    new_key = f"pdfs/{pdf_filename}"
                    
                    # Copy the PDF to the pdfs/ prefix
                    s3_client.copy_object(
                        Bucket=DOCUMENTS_BUCKET,
                        CopySource={'Bucket': DOCUMENTS_BUCKET, 'Key': key},
                        Key=new_key,
                        Metadata={
                            'source': 'manual_upload',
                            'original_key': key,
                            'processed_date': datetime.utcnow().isoformat(),
                            'data_source': 's3_bedrock_automation'
                        },
                        MetadataDirective='REPLACE'
                    )
                    
                    results['processed'].append({
                        'original_key': key,
                        'new_key': new_key,
                        'filename': pdf_filename,
                        'size': obj['Size']
                    })
                    
                    logger.info(f"Successfully moved manual PDF: {key} → {new_key}")
                    
                except Exception as e:
                    logger.error(f"Failed to process manual PDF {key}: {str(e)}")
                    results['failed'].append({
                        'key': key,
                        'error': str(e)
                    })
        
        logger.info(f"Manual PDF processing complete: {len(results['processed'])} processed, {len(results['failed'])} failed")
        
    except Exception as e:
        logger.error(f"Failed to list manual PDFs: {str(e)}")
    
    return results

def get_pdf_urls_from_file() -> List[str]:
    """
    Read PDF URLs from urls.txt file in S3 or from local data-sources folder
    """
    pdf_urls = []
    
    try:
        # First try to read from S3 (uploaded during deployment)
        try:
            response = s3_client.get_object(Bucket=DOCUMENTS_BUCKET, Key='data-sources/urls.txt')
            content = response['Body'].read().decode('utf-8')
            logger.info("Successfully read urls.txt from S3")
        except s3_client.exceptions.NoSuchKey:
            # Fallback: try reading from documents/ prefix
            try:
                response = s3_client.get_object(Bucket=DOCUMENTS_BUCKET, Key='documents/urls.txt')
                content = response['Body'].read().decode('utf-8')
                logger.info("Successfully read urls.txt from S3 documents/ prefix")
            except s3_client.exceptions.NoSuchKey:
                logger.error("urls.txt file not found in S3")
                return pdf_urls
        
        # Parse content to extract PDF URLs
        for line in content.split('\n'):
            line = line.strip()
            # Skip comments and empty lines
            if line and not line.startswith('#') and line.startswith('http'):
                # Check if it's a PDF URL
                if line.lower().endswith('.pdf'):
                    pdf_urls.append(line)
                    logger.info(f"Found PDF URL: {line}")
        
        logger.info(f"Extracted {len(pdf_urls)} PDF URLs from urls.txt")
        
    except Exception as e:
        logger.error(f"Failed to read PDF URLs from file: {str(e)}")
    
    return pdf_urls

def download_pdf(url: str) -> bytes:
    """
    Download PDF content from URL
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=60)
        response.raise_for_status()
        
        # Verify it's actually a PDF
        if response.headers.get('content-type', '').lower().startswith('application/pdf') or url.lower().endswith('.pdf'):
            return response.content
        else:
            logger.warning(f"URL {url} doesn't appear to be a PDF")
            return b''
        
    except Exception as e:
        logger.error(f"Error downloading PDF {url}: {str(e)}")
        return b''

def save_pdf_to_s3(pdf_content: bytes, key: str, metadata: Dict[str, str]) -> None:
    """
    Save PDF content to S3
    """
    try:
        s3_client.put_object(
            Bucket=DOCUMENTS_BUCKET,
            Key=key,
            Body=pdf_content,
            ContentType='application/pdf',
            Metadata=metadata
        )
        logger.info(f"Saved PDF to S3: s3://{DOCUMENTS_BUCKET}/{key}")
        
    except Exception as e:
        logger.error(f"Failed to save PDF to S3: {str(e)}")
        raise

def get_url_filename(url: str) -> str:
    """
    Generate a safe filename from URL
    """
    parsed = urllib.parse.urlparse(url)
    filename = parsed.netloc + parsed.path
    filename = filename.replace('/', '_').replace('.', '_')
    return filename[:100]  # Limit length

def extract_title_from_url(url: str) -> str:
    """
    Extract a meaningful title from PDF URL
    """
    try:
        # Get filename from URL
        filename = url.split('/')[-1]
        # Remove .pdf extension and clean up
        title = filename.replace('.pdf', '').replace('-', ' ').replace('_', ' ')
        # Capitalize words
        title = ' '.join(word.capitalize() for word in title.split())
        return title[:100]  # Limit length
    except:
        return "Blood Centers Document"

def start_ingestion_job(data_source_id: str = None, description: str = None) -> Dict[str, Any]:
    """
    Start Knowledge Base ingestion job for specified data source
    """
    try:
        # Use provided data source ID or fall back to default
        ds_id = data_source_id or DATA_SOURCE_ID
        desc = description or f"Automated ingestion job - {datetime.utcnow().isoformat()}"
        
        logger.info(f"Starting ingestion job for Knowledge Base: {KNOWLEDGE_BASE_ID}, Data Source: {ds_id}")
        
        response = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            dataSourceId=ds_id,
            description=desc
        )
        
        job_id = response.get('ingestionJob', {}).get('ingestionJobId')
        logger.info(f"Started ingestion job: {job_id}")
        
        return response.get('ingestionJob', {})
        
    except Exception as e:
        logger.error(f"Failed to start ingestion job: {str(e)}")
        return {}