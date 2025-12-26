import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import {styled, useTheme} from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {CustomizedBtn} from "../../CustomizedBtn";

export const roundStyle = {
    width: { xs: 36, md: 46 },
    height: { xs: 36, md: 46 },
    minWidth: 'unset',
    maxWidth: { xs: 36, md: 46 },
    maxHeight: { xs: 36, md: 46 },
    borderRadius: '50%',
    padding: '4px',
};

function RequestPublishButton(props) {
    const theme = useTheme();
    const { rounded, footer, handlePublisherRequest } = props;
    const { t } = useTranslation();

    return (
        <>
            <Tooltip title={t('Request becoming publisher')} placement="top">
                <CustomizedBtn id="request-publish-button" data-testid="request-publish-button" className={footer ? 'footer-icon-button' : ''} variant="contained" sx={rounded ? roundStyle : {}} color="secondary" onClick={(e) => { handlePublisherRequest(); }}>
                    <SvgIcon size={32} name={'raise-hand'} color={theme.palette?.iconColor?.primary} />
                </CustomizedBtn>
            </Tooltip>
        </>
    );
}

export default RequestPublishButton;
