import React from "react"
import { Box, Grid, Button, Typography } from "@mui/material"
import { 
  BloodtypeOutlined as BloodIcon,
  LocationOnOutlined as LocationIcon,
  InfoOutlined as InfoIcon,
  HelpOutlineOutlined as HelpIcon
} from "@mui/icons-material"
import { 
  getCurrentText, 
  PRIMARY_MAIN, 
  SECONDARY_MAIN,
  WHITE 
} from "../utilities/constants"

function FAQExamples({ currentLanguage, onFAQClick }) {
  const TEXT = getCurrentText(currentLanguage)

  const faqItems = [
    {
      icon: <BloodIcon />,
      title: currentLanguage === "en" ? "Blood Supply Status" : "Estado del Suministro de Sangre",
      description: currentLanguage === "en" 
        ? "Get real-time updates on blood type availability and urgent needs in your region and across the nation."
        : "Obtén actualizaciones en tiempo real sobre la disponibilidad de tipos de sangre y necesidades urgentes en tu región y en todo el país.",
      question: TEXT.FAQ_QUESTIONS[3]
    },
    {
      icon: <HelpIcon />,
      title: currentLanguage === "en" ? "Learn Blood Eligibility" : "Aprende sobre Elegibilidad",
      description: currentLanguage === "en"
        ? "Discover if you qualify to donate blood and understand the requirements for safe donation."
        : "Descubre si calificas para donar sangre y comprende los requisitos para una donación segura.",
      question: TEXT.FAQ_QUESTIONS[1]
    },
    {
      icon: <InfoIcon />,
      title: currentLanguage === "en" ? "Safety Information" : "Información de Seguridad",
      description: currentLanguage === "en"
        ? "Learn about our rigorous safety protocols and why donating blood is safe for both donors and recipients."
        : "Aprende sobre nuestros rigurosos protocolos de seguridad y por qué donar sangre es seguro tanto para donantes como para receptores.",
      question: TEXT.FAQ_QUESTIONS[0]
    },
    {
      icon: <LocationIcon />,
      title: currentLanguage === "en" ? "Find Donation Centers" : "Encuentra Centros de Donación",
      description: currentLanguage === "en"
        ? "Locate the nearest blood donation center and schedule your appointment today."
        : "Localiza el centro de donación de sangre más cercano y programa tu cita hoy.",
      question: TEXT.FAQ_QUESTIONS[2]
    }
  ]

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {faqItems.map((item, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Button
              onClick={() => onFAQClick(item.question)}
              sx={{
                width: "100%",
                height: "auto",
                padding: "1.5rem",
                backgroundColor: WHITE,
                border: "1px solid #E0E0E0",
                borderRadius: "12px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1,
                textTransform: "none",
                color: "inherit",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: PRIMARY_MAIN,
                  boxShadow: "0 4px 16px rgba(204, 35, 69, 0.15)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                  color: PRIMARY_MAIN,
                }}
              >
                {item.icon}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    color: PRIMARY_MAIN,
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  lineHeight: 1.5,
                  fontSize: "0.9rem",
                }}
              >
                {item.description}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* Additional FAQ Questions */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography
          variant="body2"
          sx={{
            color: "#666",
            mb: 2,
          }}
        >
          {currentLanguage === "en" ? "Or try these common questions:" : "O prueba estas preguntas comunes:"}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {[
            currentLanguage === "en" ? "Am I eligible to donate?" : "¿Soy elegible para donar?",
            currentLanguage === "en" ? "Where can I donate?" : "¿Dónde puedo donar?",
            currentLanguage === "en" ? "How is the blood supply today?" : "¿Cómo está el suministro de sangre hoy?",
            currentLanguage === "en" ? "Is it safe to donate?" : "¿Es seguro donar?",
          ].map((question, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => onFAQClick(question)}
              sx={{
                borderColor: SECONDARY_MAIN,
                color: SECONDARY_MAIN,
                borderRadius: "20px",
                textTransform: "none",
                fontSize: "0.8rem",
                "&:hover": {
                  borderColor: PRIMARY_MAIN,
                  color: PRIMARY_MAIN,
                  backgroundColor: "rgba(204, 35, 69, 0.05)",
                },
              }}
            >
              {question}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default FAQExamples