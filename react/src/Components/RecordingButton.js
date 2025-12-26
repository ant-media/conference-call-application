const RecordingButton = () => {
    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#d32f2f', // Red background
        color: 'white',
        borderRadius: '8px',
        padding: '5px 10px',
        fontWeight: 'bold',
        fontSize: '16px',
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 9999 // Ensure it appears on top
    };

    const iconStyle = {
        width: '12px',
        height: '12px',
        border: '2px solid white',
        borderRadius: '50%',
        marginRight: '8px',
        backgroundColor: 'white' // White circle
    };

    return (
        <div style={buttonStyle}>
            <div style={iconStyle}></div>
            <span>Recording</span>
        </div>
    );
};

export default RecordingButton;