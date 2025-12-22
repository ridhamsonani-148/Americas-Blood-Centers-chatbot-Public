import { ToggleButton, ToggleButtonGroup } from "@mui/material"

const LanguageSelector = ({ language, setLanguage }) => {
  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage)
    }
  }

  return (
    <ToggleButtonGroup
      value={language}
      exclusive
      onChange={handleLanguageChange}
      aria-label="language selector"
      size="small"
      sx={{
        "& .MuiToggleButton-root": {
          color: "white",
          borderColor: "rgba(255, 255, 255, 0.3)",
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
      }}
    >
      <ToggleButton value="en" aria-label="English">
        EN
      </ToggleButton>
      <ToggleButton value="es" aria-label="Spanish">
        ES
      </ToggleButton>
    </ToggleButtonGroup>
  )
};

export default LanguageSelector;