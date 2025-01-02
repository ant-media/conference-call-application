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

function PublisherRequestListButton({ footer, requestSpeakerList, publisherRequestListDrawerOpen, handlePublisherRequestListOpen }) {
    const {t} = useTranslation();

    return (
        <Tooltip title={t('Publisher Request List')} placement="top">
            <CustomizedBtn
                onClick={() => {
                    handlePublisherRequestListOpen(!publisherRequestListDrawerOpen);
                }}
                variant="contained"
                className={footer ? 'footer-icon-button' : ''}
                color={publisherRequestListDrawerOpen ? 'primary' : 'secondary'}
                id="publisher-request-list-button"
                data-testid="publisher-request-list-button"
            >
                <SvgIcon size={32} color={publisherRequestListDrawerOpen ? '#000' : '#fff'} name={'raise-hand'} />
                {requestSpeakerList.length}
            </CustomizedBtn>
        </Tooltip>
    );
}

export default PublisherRequestListButton;
