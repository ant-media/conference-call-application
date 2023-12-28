import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { AntMedia } from 'pages/AntMedia';
import { getMediaConstraints } from 'pages/AntMedia';

describe('getMediaConstraints', () => {
    it('should return qvgaConstraints when input is qvgaConstraints', () => {
        const result = getMediaConstraints('qvgaConstraints', 30);
        expect(result).toEqual({
            video: {
                width: { ideal: 320 },
                height: { ideal: 180 },
                advanced: [
                    { frameRate: { min: 30 } },
                    { height: { min: 180 } },
                    { width: { min: 320 } },
                    { frameRate: { max: 30 } },
                    { width: { max: 320 } },
                    { height: { max: 180 } },
                    { aspectRatio: { exact: 1.77778 } }
                ]
            }
        });
    });

    it('should return vgaConstraints when input is vgaConstraints', () => {
        const result = getMediaConstraints('vgaConstraints', 30);
        expect(result).toEqual({
            video: {
                width: { ideal: 640 },
                height: { ideal: 360 },
                advanced: [
                    { frameRate: { min: 30 } },
                    { height: { min: 360 } },
                    { width: { min: 640 } },
                    { frameRate: { max: 30 } },
                    { width: { max: 640 } },
                    { height: { max: 360 } },
                    { aspectRatio: { exact: 1.77778 } }
                ]
            }
        });
    });

    it('should return hdConstraints when input is hdConstraints', () => {
        const result = getMediaConstraints('hdConstraints', 30);
        expect(result).toEqual({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                advanced: [
                    { frameRate: { min: 30 } },
                    { height: { min: 720 } },
                    { width: { min: 1280 } },
                    { frameRate: { max: 30 } },
                    { width: { max: 1280 } },
                    { height: { max: 720 } },
                    { aspectRatio: { exact: 1.77778 } }
                ]
            }
        });
    });

    it('should return fullHdConstraints when input is fullHdConstraints', () => {
        const result = getMediaConstraints('fullHdConstraints', 30);
        expect(result).toEqual({
            video: {
                width: {max: 1920}, height: {max: 1080},
                advanced: [
                  {frameRate: {min: frameRate}}
                ]
              }
        });
    });

    it('should return null when input is not a valid constraint', () => {
        const result = getMediaConstraints('invalidConstraint', 30);
        expect(result).toBeNull();
    });
});

describe('AntMedia', () => {
    let component;
    let mockWebRTCAdaptor = {
        switchVideoCameraCapture: jest.fn(),
        switchAudioInputSource: jest.fn()
    };

    beforeEach(() => {
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };
        global.console = {
            log: jest.fn()
        };
        global.webRTCAdaptor = mockWebRTCAdaptor;
    });

    it('should set selected camera when cameraSelected is called', () => {
        component = render(<AntMedia />);
        act(() => {
            component.cameraSelected('camera1');
        });

        expect(global.localStorage.setItem).toHaveBeenCalledWith('selectedCamera', 'camera1');
        expect(mockWebRTCAdaptor.switchVideoCameraCapture).toHaveBeenCalledWith('publishStreamId', 'camera1');
    });

    it('should not call switchVideoCameraCapture when cameraSelected is called with the same value', () => {
        component = render(<AntMedia />);
        act(() => {
            component.cameraSelected('camera1');
            component.cameraSelected('camera1');
        });

        expect(mockWebRTCAdaptor.switchVideoCameraCapture).toHaveBeenCalledTimes(1);
    });

    it('should set selected microphone when microphoneSelected is called', () => {
        component = render(<AntMedia />);
        act(() => {
            component.microphoneSelected('microphone1');
        });

        expect(global.localStorage.setItem).toHaveBeenCalledWith('selectedMicrophone', 'microphone1');
        expect(mockWebRTCAdaptor.switchAudioInputSource).toHaveBeenCalledWith('publishStreamId', 'microphone1');
    });

    it('should not call switchAudioInputSource when microphoneSelected is called with the same value', () => {
        component = render(<AntMedia />);
        act(() => {
            component.microphoneSelected('microphone1');
            component.microphoneSelected('microphone1');
        });

        expect(mockWebRTCAdaptor.switchAudioInputSource).toHaveBeenCalledTimes(1);
    });
});
