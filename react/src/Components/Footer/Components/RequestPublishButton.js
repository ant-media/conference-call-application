import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { ConferenceContext} from "../../../pages/AntMedia";

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
    const conference = useContext(ConferenceContext);
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();


    function replaceLastOccurrence(originalString, targetText, replacementText) {
        var pos = originalString.lastIndexOf(targetText);

        if (pos === -1) {
            return originalString;
        }

        return originalString.substring(0, pos) + replacementText + originalString.substring(pos + targetText.length);
    }


    const handlePublisherRequest = (e) => {
        e.preventDefault();

        const baseUrl = conference?.restBaseUrl;
        let participant = "";
        let participants = Object.keys(conference.allParticipants);
        for (let i = 0; i < participants.length; i++) {
            if (participants[i].endsWith("admin")) {
                participant = replaceLastOccurrence(participants[i], "admin", "");
                break;
            }
        }

        let command = {
            "eventType": "REQUEST_PUBLISH",
            "streamId": conference.publishStreamId,
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command)
        };
        console.log("participant id to sent request is :" + participant);

        fetch( baseUrl+ "/rest/v2/broadcasts/" + participant + "admin/data", requestOptions).then((response) => { return response.json(); }) // FIXME
            .then((data) => {

                if (data.success) {

                    enqueueSnackbar({
                        message: t('Your request has been sent to host of the meeting'),
                        variant: 'info',
                    }, {
                        autoHideDuration: 1500,
                    });
                }
                else
                {
                    enqueueSnackbar({
                        message: t('Your request cannot be sent because error is "' + data.message + "'"),
                        variant: 'info',
                    }, {
                        autoHideDuration: 1500,
                    });
                }
            });
    };

    return (
        <>
            <Tooltip title={t('Request becoming publisher')} placement="top">
                <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" sx={rounded ? roundStyle : {}} color="secondary" onClick={(e) => { handlePublisherRequest(e) }}>
                    <SvgIcon size={32} name={'raise-hand'} color="#fff" />
                </CustomizedBtn>
            </Tooltip>
        </>
    );
}

export default RequestPublishButton;
