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
  WHITE,
  DARK_BLUE
} from "../utilities/constants"

function FAQExamples({ currentLanguage, onFAQClick }) {
  const TEXT = getCurrentText(currentLanguage)

  const faqItems = [
    {
      icon: <BloodIcon />,
      title: currentLanguage === "en" ? "Blood Supply Status" : "Estado del Suministro de Sangre",
      description: currentLanguage === "en" 
        ? "Get real-time updates on blood type availability and urgent needs in your community."
        : "Obtén actualizaciones en tiempo real sobre la disponibilidad de tipos de sangre y necesidades urgentes en tu comunidad.",
      question: TEXT.FAQ_QUESTIONS[3]
    },
    {
      icon: <HelpIcon />,
      title: currentLanguage === "en" ? "Learn About Eligibility" : "Aprende sobre Elegibilidad",
      description: currentLanguage === "en"
        ? "Discover if you qualify to donate blood and understand the requirements."
        : "Descubre si calificas para donar sangre y comprende los requisitos.",
      question: TEXT.FAQ_QUESTIONS[1]
    },
    {
      icon: <InfoIcon />,
      title: currentLanguage === "en" ? "Safety Information" : "Información de Seguridad",
      description: currentLanguage === "en"
        ? "Learn about our rigorous safety protocols and why donating blood is safe."
        : "Aprende sobre nuestros rigurosos protocolos de seguridad y por qué donar sangre es seguro.",
      question: TEXT.FAQ_QUESTIONS[0]
    },
    {
      icon: <LocationIcon />,
      title: currentLanguage === "en" ? "Find Donation Centers" : "Encuentra Centros de Donación",
      description: currentLanguage === "en"
        ? "Locate the nearest blood donation center and schedule your appointment."
        : "Localiza el centro de donación de sangre más cercano y programa tu cita.",
      question: TEXT.FAQ_QUESTIONS[2]
    }
  ]

  return (
    <Box sx={{ mb: 2, maxWidth: "1200px", mx: "auto" }}>
      {/* 4 Cards in One Row */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 2 }}>
        {faqItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Button
              onClick={() => onFAQClick(item.question)}
              sx={{
                width: "100%",
                height: { xs: "140px", sm: "150px", md: "160px" }, // Reduced height (was 160/170/180)
                padding: { xs: "0.6rem", sm: "0.8rem", md: "0.9rem" }, // Reduced padding
                backgroundColor: WHITE,
                border: "1px solid #E0E0E0",
                borderRadius: "8px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: { xs: 0.4, sm: 0.6, md: 0.8 }, // Reduced gap
                textTransform: "none",
                color: "inherit",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: PRIMARY_MAIN,
                  boxShadow: "0 4px 12px rgba(0, 97, 164, 0.15)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: { xs: 0.25, sm: 0.5 }, // Responsive margin
                  color: PRIMARY_MAIN,
                }}
              >
                {React.cloneElement(item.icon, { 
                  sx: { fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.3rem" } } 
                })}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" }, // Responsive font size
                  color: DARK_BLUE,
                  mb: { xs: 0.25, sm: 0.5 }, // Responsive margin
                  lineHeight: 1.2,
                  wordBreak: "break-word", // Prevent overflow
                  hyphens: "auto", // Allow hyphenation
                }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  lineHeight: { xs: 1.2, sm: 1.25, md: 1.3 }, // Responsive line height
                  fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" }, // Responsive font size
                  flex: 1,
                  wordBreak: "break-word", // Prevent overflow
                  hyphens: "auto", // Allow hyphenation
                  overflow: "hidden", // Hide overflow
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 4, sm: 5, md: 6 }, // Limit lines based on screen size
                  WebkitBoxOrient: "vertical",
                }}
              >
                {item.description}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* Additional FAQ Questions */}
      <Box sx={{ mt: { xs: 4, sm: 5, md: 6 }, textAlign: "center" }}> {/* Increased margin significantly */}
        <Typography
          variant="body2"
          sx={{
            color: "#666",
            mb: { xs: 2, sm: 2.5, md: 3 }, // Increased margin
            fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" }, // Responsive font size
          }}
        >
          {currentLanguage === "en" ? "Or try these common questions:" : "O prueba estas preguntas comunes:"}
        </Typography>
        <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: { xs: 0.5, sm: 0.75, md: 1 }, // Responsive gap
          justifyContent: "center",
          px: { xs: 1, sm: 0 }, // Add padding on mobile
        }}>
          {[
            currentLanguage === "en" ? "Am I eligible to donate?" : "¿Soy elegible para donar?",
            currentLanguage === "en" ? "Where can I donate?" : "¿Dónde puedo donar?",
            currentLanguage === "en" ? "How is the blood supply today?" : "¿Cómo está el suministro de sangre hoy?",
            currentLanguage === "en" ? "Advocacy & legislation" : "Defensa y legislación",
            currentLanguage === "en" ? "Is it safe to donate?" : "¿Es seguro donar?",
          ].map((question, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => onFAQClick(question)}
              sx={{
                borderColor: PRIMARY_MAIN,
                color: PRIMARY_MAIN,
                borderRadius: "20px",
                textTransform: "none",
                fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" }, // Responsive font size
                padding: { xs: "2px 8px", sm: "3px 10px" }, // Responsive padding
                minWidth: "auto", // Allow buttons to shrink
                whiteSpace: "nowrap", // Prevent text wrapping in buttons
                "&:hover": {
                  borderColor: DARK_BLUE,
                  color: DARK_BLUE,
                  backgroundColor: "rgba(0, 97, 164, 0.05)",
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