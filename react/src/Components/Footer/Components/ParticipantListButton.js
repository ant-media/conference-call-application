import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { SettingsContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {AntmediaContext} from "../../../App";

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

function ParticipantListButton({ footer, ...props }) {
    const {t} = useTranslation();
    const settings = useContext(SettingsContext);
    const {allParticipants } = settings;
    const antmedia = useContext(AntmediaContext);

    return (
            <Tooltip title={t('Participant List')} placement="top">
                <CustomizedBtn
                    onClick={() => {
                        settings?.handleParticipantListOpen(!settings?.participantListDrawerOpen);
                    }}
                    variant="contained"
                    className={footer ? 'footer-icon-button' : ''}
                    color={settings?.participantListDrawerOpen ? 'primary' : 'secondary'}
                >
                    <SvgIcon size={32} color={settings?.participantListDrawerOpen ? 'black' : 'white'} name={'participants'} />
                    {antmedia.onlyDataChannel === false ? allParticipants.length + 1 : allParticipants.length}
                </CustomizedBtn>
            </Tooltip>
        );
}

export default ParticipantListButton;
