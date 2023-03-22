import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { AntmediaContext } from 'App';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export const roundStyle = {
  width: { xs: 36, md: 46 },
  height: { xs: 36, md: 46 },
  minWidth: 'unset',
  maxWidth: { xs: 36, md: 46 },
  maxHeight: { xs: 36, md: 46 },
  borderRadius: '50%',
  padding: '4px',
};

export const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button': {
    height: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: 8,
      minWidth: 'unset',
      width: '100%',
    },
    '& > svg': {
      width: 36
    },
  }
}));


function RequestPublishButton(props) {
  const { rounded, footer } = props;
  const antmedia = useContext(AntmediaContext);
  const { t } = useTranslation();

  const handlePublisherRequest = (e) => {
    e.preventDefault();
    const appName = window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/") + 1
    ).replaceAll('/','');
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/" + appName;
    //const baseUrl = "http://localhost:5080/Conference";
    let participant = "";
    let participants = antmedia.getAllParticipants();
    for (let i = 0; i < participants.length; i++) {
      if (participants[i].streamId.endsWith("admin")) {
        participant = participants[i].streamId.replace("admin", "");
      }
    }
    let command = {
        "eventType": "REQUEST_PUBLISH",
        "streamId": antmedia.publishStreamId,
    }
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    };
    fetch( baseUrl+ "/rest/v2/broadcasts/" + participant + "/data", requestOptions).then(() => {});
  };

  return (
    <>
      <Tooltip title={t('Request becoming publisher')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" sx={rounded ? roundStyle : {}} color="secondary" onClick={(e) => { handlePublisherRequest(e) }}>
            <SvgIcon size={40} name={'raise-hand'} color="#fff" />
          </CustomizedBtn>
        </Tooltip>
    </>
  );
}

export default RequestPublishButton;
