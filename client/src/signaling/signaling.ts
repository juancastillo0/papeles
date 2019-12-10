import { client } from "..";
import { PaperPathBox, SendCandidateSignalDocument, SendCandidateSignalMutation, SendCandidateSignalMutationVariables, SendSdpSignalDocument, SendSdpSignalMutation, SendSdpSignalMutationVariables, SignalReceived, SignalType } from "../generated/graphql";
import { PaperIndexedDB, PathIdentifier } from "../services/IndexedDB";

type Peer = { id: string; email: string };

class Connection {
  constructor(
    public peerId: string,
    public pc: RTCPeerConnection,
    public dc?: RTCDataChannel
  ) {}

  candidates: RTCIceCandidate[] = [];
}

export enum DataChannelMessageType {
  CREATE_PATH = "CREATE_PATH",
  DELETE_PATH = "DELETE_PATH",
  UPDATE_PATH = "UPDATE_PATH",
  CREATE_PAPER = "CREATE_PAPER"
}

export type PaperPathMessage = PathIdentifier & { box: PaperPathBox };
export type PaperPathUpdate = PaperPathMessage & { newBox: PaperPathBox };

// export class DataChannelMessage{
//   constructor(type: DataChannelMessageType, ms :_DataChannelMessage){

//   }
//   static DeletePath(ms: PaperPathMessage){
//     return new DataChannelMessage(DataChannelMessageType.CREATE_PATH, ms);
//   }
// }
type DataChannelMessageDelete = {
  type: DataChannelMessageType.DELETE_PATH;
  path: PaperPathMessage;
};
export type DataChannelMessageUpdate = {
  type: DataChannelMessageType.UPDATE_PATH;
  paths: (PaperPathMessage & { newBox: PaperPathBox })[];
};
export type DataChannelMessageCreate = {
  type: DataChannelMessageType.CREATE_PATH;
  path: PaperPathMessage & { data: string };
};
type DataChannelMessageCreatePaper = {
  type: DataChannelMessageType.CREATE_PAPER;
  paper: PaperIndexedDB;
};

export type DataChannelMessage =
  | DataChannelMessageDelete
  | DataChannelMessageUpdate
  | DataChannelMessageCreate
  | DataChannelMessageCreatePaper;

export class Signaling {
  constructor(
    public userId: string,
    public onDataChannelMessage: (
      peerId: string,
      message: DataChannelMessage
    ) => any
  ) {}

  connections: { [key: string]: Connection } = {};

  close() {
    Object.values(this.connections).forEach(c => {
      if (c.dc) {
        c.dc.close();
      }
      c.pc.close();
    });
  }
  retryConnection(conn: Connection) {
    conn.pc.close();
    if (this.userId > conn.peerId) {
      this.createConnection(conn.peerId, true);
    } else {
      this.createConnection(conn.peerId, false);
    }
  }

  async handleSignal(signal: SignalReceived) {
    const peerId = signal.userId;

    let conn = this.connections[peerId] || this.createConnection(peerId, false);

    switch (signal.type) {
      case SignalType.Offer:
        if (conn.pc.signalingState === "have-local-offer") {
          this.retryConnection(conn);
        } else {
          await conn.pc.setRemoteDescription({
            sdp: signal.sdp!,
            type: signal.type
          });

          conn.pc
            .createAnswer()
            .then(this.setLocalAndSendMessage(conn.pc, peerId), error => {
              console.log(
                "Failed to create session description: " + error.toString()
              );
            });
        }
        break;
      case SignalType.Answer:
        if (conn.pc.signalingState === "have-remote-offer") {
          this.retryConnection(conn);
        } else {
          await conn.pc.setRemoteDescription({
            sdp: signal.sdp!,
            type: signal.type
          });
        }
        break;
      case SignalType.Candidate:
        await conn.pc.addIceCandidate(new RTCIceCandidate(signal.candidate!));
        break;
    }
  }

  async sendPathMessage(peerId: string, message: DataChannelMessage) {
    const conn = this.connections[peerId];
    if (conn && conn.dc) {
      conn.dc.send(JSON.stringify(message));
    } else {
      this.createConnection(peerId, true, () => {
        this.sendPathMessage(peerId, message);
      });
    }
  }

  createConnection(
    peerId: string,
    isInitiator: boolean,
    callbackOpen?: () => any
  ) {
    const _con = this.connections[peerId];
    if (_con) return _con;
    const pc = new RTCPeerConnection(undefined);
    const conn = new Connection(peerId, pc);
    this.connections[peerId] = conn;

    pc.onicecandidate = this.handleIceCandidate(peerId);

    if (isInitiator) {
      const dataChannel = pc.createDataChannel("data");
      conn.dc = dataChannel;
      this.onDataChannelCreated(dataChannel, peerId, callbackOpen);

      console.log("Sending offer to peer");
      pc.createOffer(this.setLocalAndSendMessage(pc, peerId), (error: any) => {
        console.log("createOffer() error: ", error);
      });
    } else {
      pc.ondatachannel = event => {
        const dataChannel = event.channel;
        conn.dc = dataChannel;
        this.onDataChannelCreated(dataChannel, peerId);
      };
    }
    setLoggers(pc);

    return pc;
  }

  onDataChannelCreated(
    channel: RTCDataChannel,
    peerId: string,
    callbackOpen?: () => any
  ) {
    channel.onerror = e => {
      console.log(`Channel error. ${e.error}`);
    };
    channel.onopen = () => {
      console.log("Channel opened.");
      if (callbackOpen) {
        callbackOpen();
      }
    };
    channel.onclose = () => {
      console.log("Channel closed.");
    };
    channel.onmessage = e => {
      this.onDataChannelMessage(peerId, e.data);
    };
  }

  handleIceCandidate(peerId: string) {
    return async function(event: RTCPeerConnectionIceEvent) {
      if (event.candidate) {
        const candidate = {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        };
        await client.mutate<
          SendCandidateSignalMutation,
          SendCandidateSignalMutationVariables
        >({
          mutation: SendCandidateSignalDocument,
          variables: {
            ...candidate,
            peerId
          }
        });
      }
    };
  }

  setLocalAndSendMessage(pc: RTCPeerConnection, peerId: string) {
    return async function(sessionDescription: RTCSessionDescriptionInit) {
      await pc.setLocalDescription(sessionDescription);

      if (!sessionDescription.sdp) return;
      const type = sessionDescription.type;
      await client.mutate<
        SendSdpSignalMutation,
        SendSdpSignalMutationVariables
      >({
        mutation: SendSdpSignalDocument,
        variables: {
          peerId,
          sdp: sessionDescription.sdp,
          type: type === "offer" ? SignalType.Offer : SignalType.Answer
        }
      });
    };
  }
}

function setLoggers(pc: RTCPeerConnection) {
  pc.onicecandidateerror = e => {
    console.log(`${e.errorCode} ${e.errorText}`);
  };
  pc.onsignalingstatechange = () => {
    console.log(pc.signalingState);
  };
  pc.oniceconnectionstatechange = () => {
    console.log(pc.iceConnectionState);
  };
  pc.onicegatheringstatechange = () => {
    console.log(pc.iceGatheringState);
  };
  pc.onconnectionstatechange = () => {
    console.log(pc.connectionState);
  };
  pc.onnegotiationneeded = function() {
    console.log("onnegotiationneeded");
  };
}
