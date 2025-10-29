import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import {  Grid,  Tabs, Tab } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseDrawerButton from './DrawerButton';
import EffectsTab from "./EffectsTab";
import {getAntDrawerStyle} from "../styles/themeUtil";

const AntDrawer = styled(Drawer)(({ theme }) => (getAntDrawerStyle(theme)));

const EffectsGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[70],
  borderRadius: 10,
}));
const TabGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  paddingBottom: 16,
  paddingTop: 16,
  flexWrap: 'nowrap',
}));

const EffectsDrawer = React.memo(props => {
  const [value, setValue] = React.useState(0);

  const { t } = useTranslation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const TabPanel = props => {
    const { children, value, index, ...other } = props;

    return (
      <div role="tabpanel" hidden={value !== index} id={`drawer-tabpanel-${index}`} aria-labelledby={`drawer-tab-${index}`} {...other} style={{ height: '100%', width: '100%' }}>
        {value === index && children}
      </div>
    );
  };

  function a11yProps(index) {
    return {
      id: `drawer-tab-${index}`,
      'aria-controls': `drawer-tabpanel-${index}`,
    };
  }

  return (
      <AntDrawer transitionDuration={200} anchor={'right'} id="effects-drawer" open={props.effectsDrawerOpen} variant="persistent">
        <EffectsGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
          <Grid item container justifyContent="space-between" alignItems="center">
            <Tabs
                TabIndicatorProps={{
                  sx: {
                    display: 'none',
                  },
                }}
                value={value}
                onChange={handleChange}
                aria-label="effects tab"
            >
              <Tab disableRipple sx={{ color: '#ffffff80', p: 1, pl: 0 }} label={t('Effects')} {...a11yProps(0)} />
            </Tabs>
            <CloseDrawerButton
                handleMessageDrawerOpen={props?.handleMessageDrawerOpen}
                handleParticipantListOpen={props?.handleParticipantListOpen}
                handleEffectsOpen={props?.handleEffectsOpen}
                setPublisherRequestListDrawerOpen={props?.setPublisherRequestListDrawerOpen}
            />
          </Grid>
          <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
            <TabPanel value={value} index={0}>
              <TabGrid container>
                <EffectsTab
                    setVirtualBackgroundImage={(img)=>props.setVirtualBackgroundImage(img)}
                    handleBackgroundReplacement={(mode)=>props.handleBackgroundReplacement(mode)}
                />
              </TabGrid>
            </TabPanel>
          </Grid>
        </EffectsGrid>
      </AntDrawer>
  );
});
export default EffectsDrawer;
