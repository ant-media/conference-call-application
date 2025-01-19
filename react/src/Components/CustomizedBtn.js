import {styled} from "@mui/material/styles";
import Button from "@mui/material/Button";

export const CustomizedBtn = styled(Button)(({ theme }) => ({
    '&.footer-icon-button': {
        height: '100%',
        [theme.breakpoints.down('sm')]: {
            padding: 8,
            minWidth: 'unset',
            width: '100%',
        },
        '& > svg': {
            width: 36,
        },
    },
}));