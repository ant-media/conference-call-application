import { render, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SettingsDialog from './SettingsDialog';

describe('SettingsDialog', () => {
    let mockConferenceContext = {
        cameraSelected: jest.fn(),
        microphoneSelected: jest.fn(),
        setSelectedBackgroundMode: jest.fn(),
        handleBackgroundReplacement: jest.fn(),
        devices: [
            { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
            { kind: 'audioinput', deviceId: 'microphone1', label: 'Microphone 1' }
        ],
        selectedCamera: '',
        selectedMicrophone: '',
        selectedBackgroundMode: ''
    };

    beforeEach(() => {
        jest.spyOn(React, 'useContext').mockImplementation(() => mockConferenceContext);
    });

    it('should select a camera when a camera is chosen', () => {
        const component = render(<SettingsDialog open={true} onClose={jest.fn()} />);
        fireEvent.change(component.getByLabelText('Camera'), { target: { value: 'camera1' } });
        expect(mockConferenceContext.cameraSelected).toHaveBeenCalledWith('camera1');
    });

    it('should select a microphone when a microphone is chosen', () => {
        const component = render(<SettingsDialog open={true} onClose={jest.fn()} />);
        fireEvent.change(component.getByLabelText('Microphone'), { target: { value: 'microphone1' } });
        expect(mockConferenceContext.microphoneSelected).toHaveBeenCalledWith('microphone1');
    });

    it('should set a background mode when a background mode is chosen', () => {
        const component = render(<SettingsDialog open={true} onClose={jest.fn()} />);
        fireEvent.change(component.getByLabelText('Background'), { target: { value: 'blur' } });
        expect(mockConferenceContext.setSelectedBackgroundMode).toHaveBeenCalledWith('blur');
        expect(mockConferenceContext.handleBackgroundReplacement).toHaveBeenCalledWith('blur');
    });
});
