import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
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

function ParticipantListButton(props) {
    const {t} = useTranslation();

    return (
            <Tooltip title={t('Participant List')} placement="top">
                <CustomizedBtn
                    onClick={() => {
                        props?.handleParticipantListOpen(!props?.participantListDrawerOpen);
                    }}
                    id="participant-list-button"
                    variant="contained"
                    className={props?.footer ? 'footer-icon-button' : ''}
                    color={props?.participantListDrawerOpen ? 'primary' : 'secondary'}
                >
                    <SvgIcon size={32} color={props?.participantListDrawerOpen ? '#000' : '#fff'} name={'participants'} />
                  {/* eslint-disable-next-line */}
                    <a style={{color: props?.participantListDrawerOpen ? '#000' : '#fff'}}>{props?.participantCount}</a>
                </CustomizedBtn>
            </Tooltip>
        );
}

export default ParticipantListButton;
