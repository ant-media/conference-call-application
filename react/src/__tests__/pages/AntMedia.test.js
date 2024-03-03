/*

NOTE: Disable this test until we can figure out how to test the AntMedia component

import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import AntMedia from "pages/AntMedia";

describe('handleResetWebRTCAdaptor', () => {

  let container = null;
  beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  it("should reset WebRTCAdaptor", () => {
    const mockWebRTCAdaptor = {
      stop: jest.fn(),
      mediaManager: {
        localStream: {
          getTracks: jest.fn().mockReturnValue([{stop: jest.fn()}])
        }
      }
    };

    act(() => {
      render(<AntMedia/>, container);
    });

    // Assuming handleResetWebRTCAdaptor is a method of AntMedia component
    // and it's binded to the instance in the constructor
    const instance = container.children[0]._component;
    instance.webRTCAdaptor = mockWebRTCAdaptor;

    instance.handleResetWebRTCAdaptor();

    expect(mockWebRTCAdaptor.stop).toHaveBeenCalledTimes(2);
    expect(mockWebRTCAdaptor.mediaManager.localStream.getTracks()[0].stop).toHaveBeenCalled();
    expect(instance.webRTCAdaptor).toBeNull();
  });

});


 */
