import React from 'react';
import { render } from '@testing-library/react';
import DummyCard from 'Components/Cards/DummyCard';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

describe('DummyCard Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <DummyCard/>
        </ThemeProvider>
    );
  });

});
