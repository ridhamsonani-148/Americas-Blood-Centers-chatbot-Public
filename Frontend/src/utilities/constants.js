// Color constants for America's Blood Centers
export const PRIMARY_MAIN = "#CC2345"
export const SECONDARY_MAIN = "#0061A4" 
export const DARK_BLUE = "#08325C"
export const LIGHT_BACKGROUND = "#F5F8FA"
export const WHITE = "#FFFFFF"

// Background colors
export const CHAT_LEFT_PANEL_BACKGROUND = PRIMARY_MAIN
export const BOTMESSAGE_BACKGROUND = "#E3F2FD"
export const USERMESSAGE_BACKGROUND = "#FFEBEE"
export const HEADER_TEXT_GRADIENT = PRIMARY_MAIN

// Text content
export const getCurrentText = (language) => {
  const texts = {
    en: {
      CHAT_HEADER_TITLE: "America's Blood Centers AI Assistant",
      ABOUT_TITLE: "About us",
      ABOUT_TEXT: "Welcome to America's Blood Centers AI Assistant. We help connect you with vital blood donation information and services. America's Blood Centers is the national association for the nation's independent, community-based blood centers. Together, we collect about 60% of the U.S. blood supply and serve more than 150 million Americans.",
      FAQS_TITLE: "FAQs",
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
      CHAT_HEADER_TITLE: "Asistente de IA de America's Blood Centers",
      ABOUT_TITLE: "Acerca de nosotros",
      ABOUT_TEXT: "Bienvenido al Asistente de IA de America's Blood Centers. Te ayudamos a conectarte con información y servicios vitales de donación de sangre. America's Blood Centers es la asociación nacional de centros de sangre independientes y comunitarios. Juntos, recolectamos aproximadamente el 60% del suministro de sangre de EE.UU. y servimos a más de 150 millones de estadounidenses.",
      FAQS_TITLE: "Preguntas Frecuentes",
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