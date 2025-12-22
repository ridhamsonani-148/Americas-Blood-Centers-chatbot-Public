"""
America's Blood Centers Chatbot - Bedrock Implementation
Lambda function for handling chat requests using Bedrock Knowledge Base and Foundation Models
"""

import json
import boto3
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
bedrock_runtime = boto3.client('bedrock-runtime')

# Environment variables
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '1000'))
TEMPERATURE = float(os.environ.get('TEMPERATURE', '0.1'))

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for Bedrock-based chat
    """
    
    # Set response headers for CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    }
    
    try:
        # Get HTTP method
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        
        # Handle preflight OPTIONS request
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'CORS preflight successful'})
            }
        
        # Handle health check (GET requests)
        if http_method == 'GET':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'service': 'America\'s Blood Centers Bedrock Chatbot',
                    'timestamp': datetime.utcnow().isoformat(),
                    'model': MODEL_ID,
                    'knowledge_base': KNOWLEDGE_BASE_ID
                })
            }
        
        # Handle chat requests (POST)
        if http_method != 'POST':
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Method not allowed. Use POST for chat requests or GET for health checks.',
                    'success': False
                })
            }
        
        # Parse request body
        if 'body' in event:
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            raise ValueError("Request body is missing")
        
        # Extract parameters
        user_message = body.get('message', '').strip()
        language = body.get('language', 'en')
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Message is required',
                    'success': False
                })
            }
        
        logger.info(f"Processing chat request: {user_message[:100]}... (language: {language})")
        
        # Step 1: Retrieve relevant context from Knowledge Base
        context_results = retrieve_context(user_message)
        
        # Step 2: Generate response using Bedrock LLM
        response_data = generate_response(user_message, context_results, language)
        
        # Step 3: Add blood center link if asking about donation locations
        sources = extract_sources(context_results)
        sources = add_blood_center_link_if_needed(user_message, sources)
        
        # Prepare final response
        chat_response = {
            "success": True,
            "message": response_data['response'],
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": {
                "sourceCount": len(sources),
                "responseLength": len(response_data['response']),
                "model": MODEL_ID,
                "language": language,
                "retrievalResults": len(context_results)
            }
        }
        
        logger.info(f"Response generated successfully with {len(sources)} sources")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(chat_response)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'success': False,
                'details': str(e) if os.environ.get('DEBUG') == 'true' else None
            })
        }

def retrieve_context(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve relevant context from Bedrock Knowledge Base
    """
    try:
        logger.info(f"Retrieving context for query: {query[:100]}...")
        
        response = bedrock_agent_runtime.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': query},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': max_results,
                    'overrideSearchType': 'HYBRID'  # Use both semantic and keyword search
                }
            }
        )
        
        results = response.get('retrievalResults', [])
        logger.info(f"Retrieved {len(results)} context results")
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving context: {str(e)}")
        return []

def generate_response(user_message: str, context_results: List[Dict[str, Any]], language: str) -> Dict[str, Any]:
    """
    Generate response using Bedrock Foundation Model with retrieved context
    """
    try:
        # Build context from retrieval results
        context_text = build_context_text(context_results)
        
        # Create prompt based on language
        prompt = create_prompt(user_message, context_text, language)
        
        logger.info(f"Generating response using model: {MODEL_ID}")
        
        # Prepare request body based on model type
        if 'claude' in MODEL_ID.lower():
            request_body = {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "anthropic_version": "bedrock-2023-05-31"
            }
        else:
            # For other models (Llama, etc.)
            request_body = {
                "prompt": prompt,
                "max_gen_len": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "top_p": 0.9
            }
        
        # Invoke the model
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request_body),
            contentType='application/json',
            accept='application/json'
        )
        
        # Parse response based on model type
        response_body = json.loads(response['body'].read())
        
        if 'claude' in MODEL_ID.lower():
            generated_text = response_body['content'][0]['text']
        else:
            generated_text = response_body.get('generation', response_body.get('outputs', [{}])[0].get('text', ''))
        
        logger.info(f"Response generated successfully: {len(generated_text)} characters")
        
        return {
            'response': generated_text,
            'model_response': response_body
        }
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return {
            'response': get_fallback_response(language),
            'model_response': None
        }

def build_context_text(context_results: List[Dict[str, Any]]) -> str:
    """
    Build context text from retrieval results
    """
    if not context_results:
        return "No specific context available."
    
    context_parts = []
    for i, result in enumerate(context_results, 1):
        content = result.get('content', {}).get('text', '')
        if content:
            context_parts.append(f"Context {i}: {content}")
    
    return "\n\n".join(context_parts)

def create_prompt(user_message: str, context: str, language: str) -> str:
    """
    Create appropriate prompt based on language and context
    """
    if language == 'es':
        return f"""Eres un asistente experto en donación de sangre para America's Blood Centers. Responde en español basándote en el contexto proporcionado.

Contexto:
{context}

Pregunta del usuario: {user_message}

Instrucciones:
- Responde SOLO en español
- Usa la información del contexto proporcionado
- Si la pregunta es sobre ubicaciones de donación, menciona el localizador de centros de sangre
- Sé preciso y útil
- Si no tienes información suficiente en el contexto, dilo claramente

Respuesta:"""
    else:
        return f"""You are an expert blood donation assistant for America's Blood Centers. Answer based on the provided context.

Context:
{context}

User question: {user_message}

Instructions:
- Answer based on the provided context
- If asked about donation locations, mention the blood center locator
- Be accurate and helpful
- If you don't have sufficient information in the context, say so clearly
- Focus on blood donation, eligibility, and America's Blood Centers information

Answer:"""

def extract_sources(context_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract source information from context results
    """
    sources = []
    
    for result in context_results:
        location = result.get('location', {})
        metadata = result.get('metadata', {})
        
        # Extract source URL and title
        source_url = location.get('s3Location', {}).get('uri', '')
        source_title = metadata.get('title', metadata.get('source', 'Document'))
        
        if source_url:
            # Determine if it's a document or web URL
            is_document = any(ext in source_url.lower() for ext in ['.pdf', '.docx', '.txt'])
            
            sources.append({
                "title": source_title,
                "url": source_url,
                "type": "DOCUMENT" if is_document else "WEB",
                "score": result.get('score', 0)
            })
    
    # Remove duplicates and sort by score
    unique_sources = []
    seen_urls = set()
    
    for source in sorted(sources, key=lambda x: x.get('score', 0), reverse=True):
        if source['url'] not in seen_urls:
            unique_sources.append(source)
            seen_urls.add(source['url'])
    
    return unique_sources

def add_blood_center_link_if_needed(user_message: str, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Add blood center locator link if user is asking about donation locations
    """
    blood_center_keywords = [
        'where can i donate', 'where to donate', 'find blood center',
        'blood center near', 'donation location', 'donate near me',
        'donde puedo donar', 'dónde puedo donar', 'centro de sangre',
        'find a center', 'locate blood center', 'donation site'
    ]
    
    is_location_question = any(keyword in user_message.lower() for keyword in blood_center_keywords)
    blood_center_url = "https://americasblood.org/for-donors/find-a-blood-center/"
    
    # Check if blood center link already exists
    has_blood_center_link = any(source.get('url') == blood_center_url for source in sources)
    
    if is_location_question and not has_blood_center_link:
        sources.insert(0, {
            "title": "Blood Center Locator - Find a Donation Location Near You",
            "url": blood_center_url,
            "type": "WEB",
            "score": 1.0
        })
        logger.info("Added blood center locator link for location question")
    
    return sources

def get_fallback_response(language: str) -> str:
    """
    Get fallback response when model fails
    """
    if language == 'es':
        return "Lo siento, tengo problemas para responder en este momento. Por favor, inténtalo de nuevo más tarde o contacta directamente a America's Blood Centers."
    else:
        return "I'm sorry, I'm having trouble responding right now. Please try again later or contact America's Blood Centers directly."