"use client"
import { getCurrentText, PRIMARY_MAIN, primary_50 } from "../utilities/constants"
import { Box, Button, Grid, useMediaQuery } from "@mui/material"

const FAQExamples = ({ onPromptClick, language = 'en' }) => {
  const TEXT = getCurrentText(language)
  const isSmallScreen = useMediaQuery("(max-width:600px)")
  
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isSmallScreen ? "0 0.5rem" : "0 1rem",
      }}
    >
      <Grid container spacing={2} justifyContent="center">
        {TEXT.FAQS.map((prompt, index) => (
          <Grid item key={index} xs={12} sm={6} md={6} lg={3}>
            <Button
              variant="outlined"
              onClick={() => onPromptClick(prompt)}
              sx={{
                width: "100%",
                textAlign: "left",
                textTransform: "none",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                backgroundColor: primary_50,
                color: PRIMARY_MAIN,
                border: `1px solid ${PRIMARY_MAIN}20`,
                fontSize: "0.9rem",
                fontWeight: 500,
                whiteSpace: "normal",
                minHeight: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "#FFCDD2",
                  border: `1px solid ${PRIMARY_MAIN}40`,
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(183, 28, 28, 0.15)",
                },
              }}
            >
              {prompt}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default FAQExamples