import React, { useEffect, useState } from "react";
import { Box, Button, LinearProgress } from "@mui/material";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import "./AnimatedButton.scss";

const AnimatedButton = ({ buttonState, onClick }) => {
  const [internalState, setInternalState] = useState(buttonState);

  useEffect(() => {
    setInternalState(buttonState);
  }, [buttonState]);

  const nextButtonStyle = {
  background: "#0087E0",
  color: "white",
  textTransform: "none",
  width: "107px",
  padding: "8px 30px",
  boxShadow: "none",
  fontSize: "16px",
  "&:hover": {
    backgroundColor: "#6962622e",
  },
};

  return (
    <Box className="button-wrapper">
      {internalState === "Next" && (
        <Button
          variant="contained"
          className="next-button"
          onClick={onClick}
          style={nextButtonStyle}
        >
          Next
        </Button>
      )}

      {internalState === "Verifying" && (
        <div className="verify-container">
          <span className="verify-text">Verifying</span>
          <div className="verify-loader">
            <LinearProgress />
            </div>
        </div>
      )}

      {internalState === "Successfull" && (
        <div className="success-container" onClick={onClick}>
          <span className="success-text">Verified Successfully</span>
          <IoIosCheckmarkCircleOutline className="success-icon" />
        </div>
      )}
    </Box>
  );
};

export default AnimatedButton;
