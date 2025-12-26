import React from "react";
import { render } from "@testing-library/react";
import OthersCard from "Components/Cards/OthersCard";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Mock theme with required properties
const mockTheme = createTheme({
  palette: {
    themeColor: {
      71: "#123456", // Replace with a mock color
      80: "#654321",
      85: "#abcdef",
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Mock props for the component
const props = {
  allParticipants: {
    "test-stream-id": { name: "John Doe" },
    "another-stream-id": { name: "Jane Smith" },
  },
  publishStreamId: "test-stream-id",
  playingParticipants: [{ streamId: "test-stream-id" }],
};

describe("OthersCard Component", () => {
  it("renders without crashing", () => {
    render(
        <ThemeProvider theme={mockTheme}>
          <OthersCard {...props} />
        </ThemeProvider>
    );
  });
});
