// src/LeftTheRoom.test.js
import React from 'react';
import { render } from '@testing-library/react';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import LeftTheRoom from "../../pages/LeftTheRoom";

// Mock the props
const props = {
  withError: "error",
  handleLeaveFromRoom: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Left The Room Component', () => {
  
  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });
  

  it('renders without crashing', () => {
    const { container, getByText, getByRole } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LeftTheRoom
                {...props}
            />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });
});
