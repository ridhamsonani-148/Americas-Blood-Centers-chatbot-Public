// Primary color constants for the theme
export const PRIMARY_MAIN = "#B71C1C" // America's Blood Centers red
export const primary_50 = "#FFEBEE" // Light red for chat bubbles
export const SECONDARY_MAIN = "#D3D3D3" // Secondary color

// Background color constants
export const CHAT_BODY_BACKGROUND = "#FFFFF7" // White background for chat
export const CHAT_LEFT_PANEL_BACKGROUND = "#8B0000" // Dark red for left panel
export const ABOUT_US_HEADER_BACKGROUND = "#FFFFFF" // White text for headers in left panel
export const FAQ_HEADER_BACKGROUND = "#FFFFFF" // White text for headers in left panel
export const ABOUT_US_TEXT = "#FFFFFF" // White text for about us
export const FAQ_TEXT = "#FFFFFF" // White text for FAQs
export const HEADER_BACKGROUND = "#FFFFFF" // White background for header
export const HEADER_TEXT_GRADIENT = "#B71C1C" // Red for header text

// Message background colors
export const BOTMESSAGE_BACKGROUND = "#FFEBEE" // Light red for bot messages
export const USERMESSAGE_BACKGROUND = "#E3F2FD" // Light blue for user messages

// API endpoints - These are automatically populated by the deployment process
const getApiBaseUrl = () => {
  // In production (Amplify), use environment variables
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL
  }

  // Check for runtime environment variables (injected by Amplify)
  if (typeof window !== "undefined" && window.ENV?.REACT_APP_API_BASE_URL) {
    return window.ENV.REACT_APP_API_BASE_URL
  }

  // Fallback to legacy API_URL for backward compatibility
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL
  }

  // If no API URL is configured, throw an error instead of using localhost
  throw new Error("API Base URL not configured. Please set REACT_APP_API_BASE_URL or REACT_APP_API_URL environment variable.")
}

export const API_BASE_URL = getApiBaseUrl()
export const CHAT_ENDPOINT =
  process.env.REACT_APP_CHAT_ENDPOINT ||
  (typeof window !== "undefined" && window.ENV?.REACT_APP_CHAT_ENDPOINT) ||
  API_BASE_URL
export const HEALTH_ENDPOINT =
  process.env.REACT_APP_HEALTH_ENDPOINT ||
  (typeof window !== "undefined" && window.ENV?.REACT_APP_HEALTH_ENDPOINT) ||
  API_BASE_URL

// Legacy support
export const API_GATEWAY_URL = API_BASE_URL

// Features
export const ALLOW_FILE_UPLOAD = false
export const ALLOW_FAQ = true

// Text Constants
export const TEXT = {
  en: {
    APP_NAME: "America's Blood Centers AI Assistant",
    APP_ASSISTANT_NAME: "America's Blood Centers AI Assistant",
    ABOUT_US_TITLE: "About us",
    ABOUT_US:
      "Welcome to America's Blood Centers AI Assistant. We help connect you with vital blood donation information and services. America's Blood Centers is the national association for the nation's largest group of independent, community-based blood centers. Together, we collect about 60% of the U.S. blood supply and serve more than 150 million Americans.",
    FAQ_TITLE: "FAQs",
    FAQS: [
      "How often can I donate blood?",
      "What are the eligibility requirements?",
      "Where can I find a blood center near me?",
      "What is the current blood supply status?",
    ],
    CHAT_HEADER_TITLE: "America's Blood Centers AI Assistant",
    CHAT_INPUT_PLACEHOLDER: "Ask about blood donation...",
    HELPER_TEXT: "Cannot send empty message",
  },
  es: {
    APP_NAME: "Asistente de IA de America's Blood Centers",
    APP_ASSISTANT_NAME: "Asistente de IA de America's Blood Centers",
    ABOUT_US_TITLE: "Acerca de nosotros",
    ABOUT_US:
      "Bienvenido al Asistente de IA de America's Blood Centers. Te ayudamos a conectarte con información vital sobre donación de sangre y servicios. America's Blood Centers es la asociación nacional del grupo más grande de centros de sangre independientes y comunitarios del país. Juntos, recolectamos aproximadamente el 60% del suministro de sangre de EE.UU. y servimos a más de 150 millones de estadounidenses.",
    FAQ_TITLE: "Preguntas frecuentes",
    FAQS: [
      "¿Con qué frecuencia puedo donar sangre?",
      "¿Cuáles son los requisitos de elegibilidad?",
      "¿Dónde puedo encontrar un centro de sangre cerca de mí?",
      "¿Cuál es el estado actual del suministro de sangre?",
    ],
    CHAT_HEADER_TITLE: "Asistente de IA de America's Blood Centers",
    CHAT_INPUT_PLACEHOLDER: "Pregunta sobre donación de sangre...",
    HELPER_TEXT: "No se puede enviar un mensaje vacío",
  }
}

// Helper function to get current language text
export const getCurrentText = (language = 'en') => TEXT[language] || TEXT.en

// Blood Center Locator Link
export const BLOOD_CENTER_LOCATOR = 'https://americasblood.org/for-donors/find-a-blood-center/'

// Useful Links
export const USEFUL_LINKS = {
  bloodSupply: 'https://americasblood.org/for-donors/americas-blood-supply/',
  findCenter: 'https://americasblood.org/for-donors/find-a-blood-center/',
  news: 'https://americasblood.org/news/',
  newsroom: 'https://americasblood.org/newsroom/',
  faqs: 'https://americasblood.org/one-pagers-faqs/',
}

// Log configuration info (for debugging)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 API Configuration:", {
    API_BASE_URL,
    CHAT_ENDPOINT,
    HEALTH_ENDPOINT,
  })
}

// Runtime configuration check
if (typeof window !== "undefined" && !process.env.REACT_APP_API_BASE_URL && !process.env.REACT_APP_API_URL && !window.ENV?.REACT_APP_API_BASE_URL) {
  console.warn("⚠️ API endpoints not configured properly.")
  console.log("💡 Make sure REACT_APP_API_BASE_URL or REACT_APP_API_URL is set in your environment variables.")
}