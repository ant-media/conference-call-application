import React from 'react';
import { render } from '@testing-library/react';
import MessageCard from 'Components/Cards/MessageCard';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

describe('MessageCard Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <MessageCard/>
      </ThemeProvider>
    );
  });

});
