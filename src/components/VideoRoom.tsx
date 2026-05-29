import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2 } from 'lucide-react';

interface VideoRoomProps {
  roomName: string;
  userName: string;
  onLeave: () => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ roomName, userName, onLeave }) => {
  return (
    <div className="w-full h-[750px] bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden relative">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={`PeerLearning_${roomName}`}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: true,
          enableEmailInStats: false,
          prejoinPageEnabled: false
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        }}
        userInfo={{
          displayName: userName,
          email: ''
        }}
        onApiReady={(externalApi) => {
          externalApi.addListener('readyToClose', onLeave);
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
        spinner={() => (
          <div className="absolute inset-0 flex items-center justify-center bg-[#020617]">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        )}
      />
    </div>
  );
};

export default VideoRoom;
