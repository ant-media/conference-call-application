# Ant Media Video Conferencing Application

This is the Github repository for Ant Media Video Conferencing application. It includes the frontend, all APIs and user interface to build large-scale, ultra-low latency video and audio conferencing and webinars. This gives companies a headstart when it comes to building their own branded tool which can scale to hundreds of thousands of viewers at the same time.

This application requires Ant Media Enterprise Edition, available from [Ant Media](https://antmedia.io).

Thanks to its non-restrictive license, you can: 

* Deploy your own white label solution where you can sell your own video conferencing service to your customers.
* Add your own code, modify the user interface to your liking, add your own branded logo and there is no need to open your source code, due to the permissive license.
* Contribute to the open source code on Github, send your PRs so that other developers can benefit from it. 

With this application, video conferencing and webinar delays are no longer existant. With its chat capabilities, audience can not only make 2-way video and audio calls, but also can actively communicate with each other over a chat pane, thanks to the WebRTC data channel feature.

Moreover, the application has been designed to be fully mobile-friendly from ground up. Video and audio calling can also be viewed on mobile devices and tablets, and users can share their screens just like how they do on their browsers. Fully featured SDKs covering Flutter, React Native and Unity makes it a breeze to build your own mobile apps on top of AntMeet.

## Features 

* Full HD video for up to 1080p and Opus code for audio calling.
* WebRTC for highest quality and lowest latency.
* Group chat: Ability to send messages to all participants in a session.
* Share your full desktop screen or individual applications both for mobile and desktop.
* Supports up to 200 online participants for a single server, much higher for clustered services.
* Meets GDRP requirements for data processors and compliant with HIPAA easily as you deploy on premises.
* Optional managed services (dedicated cloud service management).


## Installation Onto Ant Media Server
* Download the latest [war file](https://oss.sonatype.org/#nexus-search;gav~io.antmedia.webrtc~ConferenceCall~~~~kw,versionexpand) generated by this repository 
* Login to Ant Media Server Management Panel
* On the Dashboard page click New Application button
* Click Chose File button and browse the war file you downloaded
* Give a name to application
* Click Create button. That's all.

![Installing Conference Application](https://antmedia.io/wp-content/uploads/2022/10/Adding-Conference-App-1024x436.jpeg "Installing Conference Application")

## Usage
* Visit "https://<your_antmediaserver_url>/<application_name_from_installation_step>"
* Click "Create Meeting"
![meet antmedia io_5443_Conference_](https://user-images.githubusercontent.com/6155330/194052919-feb46716-57ab-430d-9dcb-9e9f2935edaa.png)
* Enter a name for yourself and join the meeting
![meet antmedia io_5443_Conference_ (2)](https://user-images.githubusercontent.com/6155330/194053030-30101c83-c87f-4c61-990f-14923917f36e.png)
* Click on the info button to get the meeting link or just copy it from the browser url.
![meet antmedia io_5443_Conference_ (3)](https://user-images.githubusercontent.com/6155330/194054002-17cb7545-4230-468f-a6e8-6847a83a8092.png)
* Share it with anyone you want to start video conferencing!
![Screen-Shot-2022-06-08-at-11 11 11-AM-1024x726](https://user-images.githubusercontent.com/6155330/194052520-4742c23d-2b7f-4ca1-8c99-e30120a37af3.png)


