import * as React from "react";
import Drawer from "@mui/material/Drawer";
import { SettingsContext,MediaSettingsContext } from "pages/AntMedia";
import { styled } from "@mui/material/styles";
import {
  Button,
  Grid,
  Typography,
  useTheme,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { SvgIcon } from "./SvgIcon";
import MessageCard from "./Cards/MessageCard";
import MessageInput from "./MessageInput";
import { useTranslation } from "react-i18next";

const AntDrawer = styled(Drawer)(({ theme }) => ({
  "& .MuiBackdrop-root": {
    backgroundColor: "transparent",
  },
  "& .MuiPaper-root": {
    padding: 12,
    backgroundColor: "transparent",
    boxShadow: "unset",
    width: 360,
    border: "unset",
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      padding: 0,
      backgroundColor: theme.palette.green70,
    },
  },
}));
const TextContainer = styled(Grid)(({ theme }) => ({
  padding: "10px 18px 8px 18px",
  background: theme.palette.green[60],
  borderRadius: 6,
  color: theme.palette.green[0],
}));

const MessageGrid = styled(Grid)(({ theme }) => ({
  position: "relative",
  padding: 16,
  background: theme.palette.green[70],
  borderRadius: 10,
}));
const TabGrid = styled(Grid)(({ theme }) => ({
  position: "relative",
  height: "100%",
  paddingBottom: 16,
  paddingTop: 16,
  flexWrap: "nowrap",
}));
const ParticipantName = styled(Typography)(({ theme }) => ({
  color: "#ffffff",
  fontWeight: 500,
  fontSize: 14,
}));
const PinBtn = styled(Button)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.green[50],
  },
}));
const MessageDrawer = React.memo((props) => {
  const settings = React.useContext(SettingsContext);
  const mediaSettings = React.useContext(MediaSettingsContext);
  console.log('settings: ', mediaSettings);
  const { drawerOpen, pinnedVideoId, pinVideo } = settings;
  const [value, setValue] = React.useState(0);
  const { allParticipants } = props;
  console.log('msgx allParticipants: ',  allParticipants);

  const theme = useTheme();
  const { t } = useTranslation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`drawer-tabpanel-${index}`}
        aria-labelledby={`drawer-tab-${index}`}
        {...other}
        style={{ height: "100%", width: "100%" }}
      >
        {value === index && children}
      </div>
    );
  };
  const getParticipantItem = (videoId, name) => {
    return (
      <Grid
        key={videoId}
        container
        alignItems="center"
        justifyContent="space-between"
        style={{ borderBottomWidth: 1 }}
        sx={{ borderColor: "primary.main" }}
      >
        <Grid item sx={{ pr: 1 }}>
          <ParticipantName variant="body1">{name}</ParticipantName>
        </Grid>
        <Grid item>
          {pinnedVideoId === videoId ? (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => pinVideo(videoId)}
            >
              <SvgIcon size={28} name="unpin" color="#fff" />
            </PinBtn>
          ) : (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => pinVideo(videoId)}
            >
              <SvgIcon size={28} name="pin" color="#fff" />
            </PinBtn>
          )}
        </Grid>
      </Grid>
    );
  };
  function a11yProps(index) {
    return {
      id: `drawer-tab-${index}`,
      "aria-controls": `drawer-tabpanel-${index}`,
    };
  }

  return (
    <AntDrawer
      transitionDuration={200}
      anchor={"right"}
      id="message-drawer"
      open={drawerOpen}
      variant="persistent"
    >
      <MessageGrid
        container
        direction="column"
        style={{ flexWrap: "nowrap", height: "100%", overflow: "hidden" }}
      >
        <Grid item container justifyContent="space-between" alignItems="center">
          <Tabs
            TabIndicatorProps={{
              sx: {
                display: "none",
              },
            }}
            value={value}
            onChange={handleChange}
            aria-label="messages and participant tabs"
          >
            <Tab
              disableRipple
              sx={{ color: "#ffffff80", p: 1, pl: 0 }}
              label={t("Messages")}
              {...a11yProps(0)}
            />
            <Tab
              disableRipple
              sx={{ color: "#ffffff80", p: 1, pl: 0 }}
              label={t("Participants")}
              {...a11yProps(1)}
            />
          </Tabs>
          <Button
            sx={{ minWidth: 30 }}
            onClick={() => settings?.handleDrawerOpen(false)}
          >
            <SvgIcon size={24} name={"close"} color={"white"} />
          </Button>
        </Grid>
        <Grid
          item
          container
          justifyContent="space-between"
          alignItems="center"
          id="paper-props"
          style={{ flex: "1 1 auto", overflowY: "auto" }}
        >
          <TabPanel value={value} index={0}>
            <TabGrid container sx={{ pb: 0 }} direction={"column"}>
              <TextContainer item container>
                <Typography
                  color={theme.palette.green[0]}
                  style={{ fontSize: 12 }}
                  variant="body2"
                  align="center"
                >
                  {t(
                    "Messages can only be seen by people in the call and are deleted when the call ends"
                  )}
                </Typography>
              </TextContainer>
              <Grid
                item
                container
                sx={{ mt: 1 }}
                style={{ flexWrap: "nowrap", flex: "auto", overflowY: "auto" }}
              >
                {" "}
                <Grid item xs={12}>
                  {settings?.messages.map((m, index) => (

                    <Grid item key={index} xs={12}>
                      <MessageCard
                        date={m.date}
                        isMe={m?.eventType ? false : true}
                        name={m.name}
                        message={m.message}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </TabGrid>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <TabGrid container>
              <Stack sx={{ width: "100%" }} spacing={2}>
                <Grid container>
                  <SvgIcon size={28} name="participants" color="#fff" />
                  <ParticipantName
                    variant="body2"
                    style={{ marginLeft: 4, fontWeight: 500 }}
                  >
                    {allParticipants.length + 1}
                  </ParticipantName>
                </Grid>
                {getParticipantItem("localVideo", "You")}

                {allParticipants.map(({ id, streamName }, index) => {
                  return getParticipantItem(id, streamName);
                })}
              </Stack>
            </TabGrid>
          </TabPanel>
        </Grid>
        {value === 0 && <MessageInput />}
      </MessageGrid>
    </AntDrawer>
  );
});
export default MessageDrawer;
