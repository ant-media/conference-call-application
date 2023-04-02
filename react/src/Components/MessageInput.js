import React, { useContext, useState } from "react";
import { Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AntmediaContext } from "App";
import { SettingsContext } from "pages/AntMedia";
import EmojiPicker, {Emoji, EmojiStyle} from 'emoji-picker-react';
import { useTranslation } from "react-i18next";

const MessageInputContainer = styled(Grid)(({ theme }) => ({
  padding: "16px 16px 8px 16px",
  background: theme.palette.green[70],
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: "16px 0px 8px 0px",
  },
}));
const MessageTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 30,
    backgroundColor: theme.palette.green[60],
  },
  "& .MuiOutlinedInput-input::placeholder": {
    color: theme.palette.green[90],
    fontWeight: 400,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: 30,
  },
}));
const MessageInput = React.memo(() => {
  const antmedia = useContext(AntmediaContext);
  const settings = React.useContext(SettingsContext);
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const sendMessage = () => {
    if (text) {
      antmedia.handleSendMessage(text);
      settings?.handleSetMessages({
        name: "You",
        message: text,
        date: new Date().toString()
      });
      setShowEmojiPicker(false);
      setText("");
    }
  };
  return (
    <MessageInputContainer container>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        {showEmojiPicker ?
            <EmojiPicker onEmojiClick={(emojiData, event)=> {setText(text + " " + emojiData.emoji)}} width="300px" height="610px"/>
            : null}
        <MessageTextField
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">
                <IconButton
                    onClick={() => {setShowEmojiPicker(!showEmojiPicker)}}
                    aria-label="toggle password visibility"
                    size={"medium"}
                    edge="end"
                >
                  <Emoji
                      unified={"1f600"}
                      emojiStyle={EmojiStyle.APPLE}
                      size={22}
                  />
                </IconButton>
                <IconButton
                  onClick={sendMessage}
                  aria-label="toggle password visibility"
                  size={"medium"}
                  edge="end"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="17"
                    viewBox="0 0 20 17"
                    fill="none"
                  >
                    <path
                      d="M0 16.177V0.823047C0 0.525274 0.126405 0.297291 0.379214 0.1391C0.632023 -0.0190921 0.898877 -0.0423556 1.17978 0.0693092L19.4944 7.71835C19.8315 7.86723 20 8.12778 20 8.5C20 8.87222 19.8315 9.13277 19.4944 9.28165L1.17978 16.9307C0.898877 17.0424 0.632023 17.0191 0.379214 16.8609C0.126405 16.7027 0 16.4747 0 16.177ZM1.68539 14.837L16.9663 8.5L1.68539 2.07928V6.7692L8.48315 8.5L1.68539 10.175V14.837ZM1.68539 8.5V2.07928V6.7692V10.175V14.837V8.5Z"
                      fill="#CDFFFB"
                    />
                  </svg>
                </IconButton>
              </InputAdornment>
            ),
          }}
          fullWidth
          placeholder={t("Send a message")}
          variant="outlined"
        />
      </form>
    </MessageInputContainer>
  );
});

export default MessageInput;
