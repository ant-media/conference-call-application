import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ConferenceContext } from 'pages/AntMedia';

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
    const conference = useContext(ConferenceContext);

    return (
        <Tooltip title={t('Publisher Request List')} placement="top">
            <CustomizedBtn
                onClick={() => {
                    conference?.handlePublisherRequestListOpen(!conference?.publisherRequestListDrawerOpen);
                }}
                variant="contained"
                className={footer ? 'footer-icon-button' : ''}
                color={conference?.publisherRequestListDrawerOpen ? 'primary' : 'secondary'}
            >
                <SvgIcon size={32} color={conference?.publisherRequestListDrawerOpen ? '#000' : '#fff'} name={'raise-hand'} />
                {conference.requestSpeakerList.length}
            </CustomizedBtn>
        </Tooltip>
    );
}

export default PublisherRequestListButton;
