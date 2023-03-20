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
    antmedia.handleSendMessage("listener*"+antmedia.publishStreamId+"*REQUEST_PUBLISH");
  };

  return (
    <>
      <Tooltip title={t('Request becoming publisher')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" sx={rounded ? roundStyle : {}} color="secondary" onClick={(e) => { handlePublisherRequest(e) }}>
            <SvgIcon size={40} name={'microphone'} color="#fff" />
          </CustomizedBtn>
        </Tooltip>
    </>
  );
}

export default RequestPublishButton;
