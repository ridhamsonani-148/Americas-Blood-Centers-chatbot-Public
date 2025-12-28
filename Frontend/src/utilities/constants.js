// Color constants for America's Blood Centers - Blue Theme
export const PRIMARY_MAIN = "#0061A4"
export const SECONDARY_MAIN = "#08325C" 
export const DARK_BLUE = "#08325C"
export const LIGHT_BACKGROUND = "#F5F8FA"
export const WHITE = "#FFFFFF"
export const LIGHT_GRAY = "#F8F9FA"

// Background colors
export const CHAT_LEFT_PANEL_BACKGROUND = WHITE
export const CHAT_BODY_BACKGROUND = WHITE
export const BOTMESSAGE_BACKGROUND = "#E3F2FD"
export const USERMESSAGE_BACKGROUND = "#E8F4FD"
export const HEADER_TEXT_GRADIENT = DARK_BLUE

// Text colors
export const ABOUT_US_TEXT = DARK_BLUE
export const FAQ_TEXT = DARK_BLUE
export const primary_50 = "rgba(0, 97, 164, 0.1)"

// Text content
export const getCurrentText = (language) => {
  const texts = {
    en: {
      CHAT_HEADER_TITLE: "Bloodline",
      ABOUT_US_TITLE: "About us",
      ABOUT_US: "Welcome to America's Blood Centers AI Assistant. We help connect you with vital blood donation information and services. America's Blood Centers is the national association for the nation's independent, community-based blood centers. Together, we collect about 60% of the U.S. blood supply and serve more than 150 million Americans.",
      FAQ_TITLE: "FAQs",
      FAQS: [
        "How often can I donate blood?",
        "What are the eligibility requirements?", 
        "Where can I find a blood center near me?",
        "What is the current blood supply status?",
        "Is it safe to donate blood?",
        "What should I do before donating?"
      ],
      FAQ_QUESTIONS: [
        "How often can I donate blood?",
        "What are the eligibility requirements?", 
        "Where can I find a blood center near me?",
        "What is the current blood supply status?"
      ],
      CHAT_PLACEHOLDER: "Ask about blood donation...",
      SEND_BUTTON: "Send",
      LANGUAGE_TOGGLE: "ES"
    },
    es: {
      CHAT_HEADER_TITLE: "Línea de Sangre",
      ABOUT_US_TITLE: "Acerca de nosotros",
      ABOUT_US: "Bienvenido al Asistente de IA de America's Blood Centers. Te ayudamos a conectarte con información y servicios vitales de donación de sangre. America's Blood Centers es la asociación nacional de centros de sangre independientes y comunitarios. Juntos, recolectamos aproximadamente el 60% del suministro de sangre de EE.UU. y servimos a más de 150 millones de estadounidenses.",
      FAQ_TITLE: "Preguntas Frecuentes",
      FAQS: [
        "¿Con qué frecuencia puedo donar sangre?",
        "¿Cuáles son los requisitos de elegibilidad?",
        "¿Dónde puedo encontrar un centro de sangre cerca de mí?",
        "¿Cuál es el estado actual del suministro de sangre?",
        "¿Es seguro donar sangre?",
        "¿Qué debo hacer antes de donar?"
      ],
      FAQ_QUESTIONS: [
        "¿Con qué frecuencia puedo donar sangre?",
        "¿Cuáles son los requisitos de elegibilidad?",
        "¿Dónde puedo encontrar un centro de sangre cerca de mí?",
        "¿Cuál es el estado actual del suministro de sangre?"
      ],
      CHAT_PLACEHOLDER: "Pregunta sobre donación de sangre...",
      SEND_BUTTON: "Enviar", 
      LANGUAGE_TOGGLE: "EN"
    }
  }
  return texts[language] || texts.en
}