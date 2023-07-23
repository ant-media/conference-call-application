import React, { useContext, useEffect } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { SettingsContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button':{
    height: '100%',
    [theme.breakpoints.down('sm')]:{
      padding: 8,
      minWidth: 'unset',
      width: '100%',
      '& > svg': {
        width: 36
      },
    },
  }
}));

function PublisherRequestListButton({ footer, ...props }) {
    const {t} = useTranslation();
    const settings = useContext(SettingsContext);
    const {requestSpeakerList } = settings;

    return (
            <Tooltip title={t('Publisher Request List')} placement="top">
                <CustomizedBtn
                    onClick={() => {
                        settings?.handlePublisherRequestListOpen(!settings?.publisherRequestListDrawerOpen);
                    }}
                    variant="contained"
                    className={footer ? 'footer-icon-button' : ''}
                    color={settings?.publisherRequestListDrawerOpen ? 'primary' : 'secondary'}
                >
                    <SvgIcon size={32} color={settings?.publisherRequestListDrawerOpen ? 'black' : 'white'} name={'raise-hand'} />
                    {requestSpeakerList.length}
                </CustomizedBtn>
            </Tooltip>
        );
}

export default PublisherRequestListButton;
