/**
 * Creates a message block for the chat
 * @param {string} text - The message text
 * @param {string} sender - 'user' or 'bot'
 * @param {Array} sources - Optional array of sources
 * @returns {Object} Message object
 */
export const createMessageBlock = (text, sender = 'bot', sources = []) => {
  return {
    id: Date.now() + Math.random(),
    text,
    sender,
    timestamp: new Date().toISOString(),
    sources,
  }
}

/**
 * Creates a welcome message
 * @param {string} language - 'en' or 'es'
 * @returns {Object} Welcome message object
 */
export const createWelcomeMessage = (language = 'en') => {
  const welcomeText = language === 'es'
    ? "¡Hola! Soy el asistente de America's Blood Centers. ¿Cómo puedo ayudarte con información sobre donación de sangre?"
    : "Hello! I'm America's Blood Centers assistant. How can I help you with blood donation information?"
  
  return createMessageBlock(welcomeText, 'bot')
}

/**
 * Creates an error message
 * @param {string} language - 'en' or 'es'
 * @returns {Object} Error message object
 */
export const createErrorMessage = (language = 'en') => {
  const errorText = language === 'es'
    ? 'Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.'
    : 'I apologize, but I encountered an error processing your request. Please try again.'
  
  return {
    ...createMessageBlock(errorText, 'bot'),
    isError: true,
  }
}